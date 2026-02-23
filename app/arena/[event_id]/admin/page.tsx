import React from 'react';
import { MasterConsole } from '@/components/sports/MasterConsole';

export default async function ArenaMasterPage({ params }: { params: Promise<{ event_id: string }> }) {
    const { event_id } = await params;
    // 零配置提取上下文，赋予终端组件隔离血统 (Zero-config Context Extraction)
    return <MasterConsole eventId={event_id} />;
}
