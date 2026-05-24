-- =============================================================================
-- ztoevent.com — Anti-Oversell RPC Function
-- Function: reserve_ticket_and_create_order
-- Version: 1.0.0
-- =============================================================================
-- ARCHITECTURE DECISION: SELECT ... FOR UPDATE NOWAIT
--
-- Why NOWAIT instead of FOR UPDATE (blocking)?
--   - Under a spike of 500 concurrent buyers for the last 10 tickets, a blocking
--     lock would cause 490 workers to queue and hold connections for seconds,
--     exhausting the Supabase connection pool and causing cascading timeouts.
--   - NOWAIT causes the 490 "losers" to fail immediately with a lock error,
--     which is caught, and they receive an instant "Sold Out" response.
--   - This means we hold a connection lock for microseconds per winner, not seconds.
--
-- Why a stored procedure (not application-level logic)?
--   - The entire read-check-decrement-write cycle happens in a SINGLE transaction
--     inside the database engine. No network round-trips between check and update.
--   - Application code cannot produce a race condition here.
-- =============================================================================

CREATE OR REPLACE FUNCTION reserve_ticket_and_create_order(
    p_tier_id       UUID,           -- Ticket tier being purchased
    p_user_id       UUID,           -- Authenticated user making the purchase
    p_quantity      INTEGER,        -- Number of tickets requested
    p_buyer_name    TEXT,           -- Buyer display name
    p_buyer_email   TEXT,           -- Buyer email
    p_buyer_phone   TEXT DEFAULT NULL   -- Optional phone
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER   -- Runs with elevated privileges to bypass RLS on writes
AS $$
DECLARE
    v_tier          zt_ticket_tiers%ROWTYPE;
    v_event         zt_events%ROWTYPE;
    v_order_id      UUID;
    v_order_item_id UUID;
    v_subtotal      DECIMAL(10, 2);
    v_expires_at    TIMESTAMPTZ;
BEGIN
    -- =========================================================================
    -- STEP 1: Lock the tier row for this transaction (NOWAIT = fail immediately
    -- if another transaction holds the lock, rather than waiting in queue).
    -- This is the critical section — only ONE transaction can be here at a time.
    -- =========================================================================
    BEGIN
        SELECT * INTO v_tier
        FROM zt_ticket_tiers
        WHERE id = p_tier_id
        FOR UPDATE NOWAIT;
    EXCEPTION
        WHEN lock_not_available THEN
            -- Another transaction is modifying this tier right now.
            -- Return a retryable error — the client should retry after a short delay.
            RETURN jsonb_build_object(
                'success',  false,
                'code',     'LOCK_UNAVAILABLE',
                'message',  'System is processing another request for this ticket. Please try again in a moment.'
            );
    END;

    -- =========================================================================
    -- STEP 2: Validate the tier exists and is available for purchase
    -- =========================================================================
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'TIER_NOT_FOUND',
            'message',  'Ticket tier not found.'
        );
    END IF;

    IF v_tier.status = 'sold_out' OR v_tier.status = 'hidden' OR v_tier.status = 'paused' THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'TIER_UNAVAILABLE',
            'message',  'This ticket tier is currently unavailable.'
        );
    END IF;

    -- Check sales window if configured
    IF v_tier.sales_start_at IS NOT NULL AND NOW() < v_tier.sales_start_at THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'SALES_NOT_OPEN',
            'message',  'Ticket sales have not started yet.',
            'opens_at', v_tier.sales_start_at
        );
    END IF;

    IF v_tier.sales_end_at IS NOT NULL AND NOW() > v_tier.sales_end_at THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'SALES_CLOSED',
            'message',  'Ticket sales have closed for this tier.'
        );
    END IF;

    -- =========================================================================
    -- STEP 3: Validate quantity constraints
    -- =========================================================================
    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'INVALID_QUANTITY',
            'message',  'Quantity must be at least 1.'
        );
    END IF;

    IF p_quantity > v_tier.max_per_order THEN
        RETURN jsonb_build_object(
            'success',      false,
            'code',         'EXCEEDS_MAX_PER_ORDER',
            'message',      format('Maximum %s ticket(s) per order for this tier.', v_tier.max_per_order),
            'max_allowed',  v_tier.max_per_order
        );
    END IF;

    -- =========================================================================
    -- STEP 4: THE CRITICAL CHECK — Is there enough capacity?
    -- This check is safe because we hold the FOR UPDATE lock on this row.
    -- No other transaction can read a stale value until we COMMIT or ROLLBACK.
    -- =========================================================================
    IF v_tier.available_capacity < p_quantity THEN
        -- Auto-update tier status to sold_out if we've hit zero
        IF v_tier.available_capacity = 0 THEN
            UPDATE zt_ticket_tiers
            SET status = 'sold_out', updated_at = NOW()
            WHERE id = p_tier_id;
        END IF;

        RETURN jsonb_build_object(
            'success',              false,
            'code',                 'OUT_OF_STOCK',
            'message',              'Sorry, not enough tickets available.',
            'requested',            p_quantity,
            'available_capacity',   v_tier.available_capacity
        );
    END IF;

    -- =========================================================================
    -- STEP 5: Fetch parent event for currency and validation
    -- =========================================================================
    SELECT * INTO v_event FROM zt_events WHERE id = v_tier.event_id;

    IF NOT FOUND OR v_event.status NOT IN ('on_sale', 'published') THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'EVENT_UNAVAILABLE',
            'message',  'This event is not currently accepting registrations.'
        );
    END IF;

    -- =========================================================================
    -- STEP 6: ATOMICALLY DECREMENT capacity (still within the same transaction)
    -- =========================================================================
    UPDATE zt_ticket_tiers
    SET
        available_capacity = available_capacity - p_quantity,
        -- Auto-mark as sold_out if we've just taken the last slot(s)
        status = CASE
            WHEN (available_capacity - p_quantity) = 0 THEN 'sold_out'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_tier_id;

    -- =========================================================================
    -- STEP 7: Create the order record
    -- Order starts as 'pending' — expires in 15 minutes if payment not completed
    -- =========================================================================
    v_subtotal   := v_tier.price * p_quantity;
    v_expires_at := NOW() + INTERVAL '15 minutes';

    INSERT INTO zt_orders (
        user_id, event_id, status, total_amount, currency,
        buyer_name, buyer_email, buyer_phone, expires_at
    )
    VALUES (
        p_user_id, v_tier.event_id, 'pending', v_subtotal, v_event.currency,
        p_buyer_name, p_buyer_email, p_buyer_phone, v_expires_at
    )
    RETURNING id INTO v_order_id;

    -- =========================================================================
    -- STEP 8: Create the order item (line item snapshot)
    -- Snapshot the tier name and price at time of purchase for audit trail
    -- =========================================================================
    INSERT INTO zt_order_items (
        order_id, tier_id, quantity, unit_price, subtotal, tier_name
    )
    VALUES (
        v_order_id, p_tier_id, p_quantity, v_tier.price, v_subtotal, v_tier.name
    )
    RETURNING id INTO v_order_item_id;

    -- =========================================================================
    -- STEP 9: COMMIT and return success payload
    -- The transaction commits here — lock is released, capacity is permanently
    -- decremented. The order is now "held" for 15 minutes.
    -- =========================================================================
    RETURN jsonb_build_object(
        'success',          true,
        'code',             'RESERVED',
        'order_id',         v_order_id,
        'order_item_id',    v_order_item_id,
        'event_id',         v_tier.event_id,
        'tier_id',          p_tier_id,
        'tier_name',        v_tier.name,
        'quantity',         p_quantity,
        'unit_price',       v_tier.price,
        'total_amount',     v_subtotal,
        'currency',         v_event.currency,
        'expires_at',       v_expires_at,
        'message',          'Tickets reserved. Complete payment within 15 minutes.'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Catch-all: any unexpected error rolls back the entire transaction.
        -- The capacity decrement is NOT committed if we reach here.
        RAISE WARNING 'reserve_ticket_and_create_order error: % %', SQLERRM, SQLSTATE;
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'INTERNAL_ERROR',
            'message',  'An unexpected error occurred. Please try again.',
            'detail',   SQLERRM
        );
END;
$$;

-- =============================================================================
-- Grant execute permission to authenticated users
-- (service_role always has execute access)
-- =============================================================================
GRANT EXECUTE ON FUNCTION reserve_ticket_and_create_order(UUID, UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- COMPANION FUNCTION: confirm_order_payment
-- Called by the webhook handler after payment gateway confirms payment.
-- Creates zt_attendees records with unique QR ticket codes.
-- =============================================================================

CREATE OR REPLACE FUNCTION confirm_order_payment(
    p_order_id          UUID,
    p_payment_provider  TEXT,
    p_payment_reference TEXT,
    p_payment_metadata  JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order         zt_orders%ROWTYPE;
    v_item          zt_order_items%ROWTYPE;
    v_ticket_code   TEXT;
    v_attendee_ids  UUID[] := '{}';
    v_attendee_id   UUID;
    i               INTEGER;
BEGIN
    -- Lock the order row
    SELECT * INTO v_order FROM zt_orders WHERE id = p_order_id FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'message', 'Order not found.');
    END IF;

    -- Idempotency: if already paid, return success (webhook may fire twice)
    IF v_order.status = 'paid' THEN
        RETURN jsonb_build_object(
            'success',  true,
            'code',     'ALREADY_CONFIRMED',
            'order_id', p_order_id,
            'message',  'Order already confirmed.'
        );
    END IF;

    IF v_order.status != 'pending' AND v_order.status != 'awaiting_payment' THEN
        RETURN jsonb_build_object(
            'success',  false,
            'code',     'INVALID_ORDER_STATUS',
            'message',  format('Cannot confirm order with status: %s', v_order.status)
        );
    END IF;

    -- Update order to paid
    UPDATE zt_orders
    SET
        status              = 'paid',
        payment_provider    = p_payment_provider,
        payment_reference   = p_payment_reference,
        payment_metadata    = p_payment_metadata,
        paid_at             = NOW(),
        expires_at          = NULL,     -- Clear the expiry
        updated_at          = NOW()
    WHERE id = p_order_id;

    -- Generate one zt_attendees record per ticket in each order item
    FOR v_item IN SELECT * FROM zt_order_items WHERE order_id = p_order_id LOOP
        FOR i IN 1..v_item.quantity LOOP
            -- Generate a cryptographically unique ticket code
            v_ticket_code := encode(gen_random_bytes(16), 'hex');

            INSERT INTO zt_attendees (
                order_id, order_item_id, tier_id, event_id,
                user_id, attendee_name, attendee_email, ticket_code
            )
            VALUES (
                p_order_id, v_item.id, v_item.tier_id, v_order.event_id,
                v_order.user_id, v_order.buyer_name, v_order.buyer_email, v_ticket_code
            )
            RETURNING id INTO v_attendee_id;

            v_attendee_ids := array_append(v_attendee_ids, v_attendee_id);
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success',          true,
        'code',             'PAYMENT_CONFIRMED',
        'order_id',         p_order_id,
        'attendee_ids',     v_attendee_ids,
        'attendee_count',   array_length(v_attendee_ids, 1),
        'message',          'Payment confirmed and attendee records created.'
    );

EXCEPTION
    WHEN lock_not_available THEN
        RETURN jsonb_build_object('success', false, 'code', 'LOCK_UNAVAILABLE', 'message', 'Order is being processed. Please retry.');
    WHEN OTHERS THEN
        RAISE WARNING 'confirm_order_payment error: % %', SQLERRM, SQLSTATE;
        RETURN jsonb_build_object('success', false, 'code', 'INTERNAL_ERROR', 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_order_payment(UUID, TEXT, TEXT, JSONB) TO service_role;
