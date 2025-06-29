import React from 'react';

function QuickStatsSection({ workspaces, loading, formatLastOpenTime, getWorkspaceStatus }) {
    const stats = [
        { label: 'Total Workspaces', value: workspaces.length, color: '#4caf50' },
        { 
            label: 'Active Sessions', 
            value: workspaces.filter(w => getWorkspaceStatus(w.lastOpenTime) === 'active').length, 
            color: '#ffd700' 
        },
        { 
            label: 'Recent Activity', 
            value: workspaces.length > 0 ? formatLastOpenTime(
                Math.max(...workspaces.map(w => new Date(w.lastOpenTime || 0).getTime()))
            ) : 'No activity', 
            color: '#2196f3' 
        },
        { label: 'Status', value: loading ? 'Loading...' : 'Ready', color: '#4caf50' }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%'
        }}>
            {stats.map((stat, idx) => (
                <div key={idx} style={{
                    background: '#23232f',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        color: stat.color, 
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        marginBottom: 4
                    }}>
                        {stat.value}
                    </div>
                    <div style={{ 
                        color: '#ccc', 
                        fontSize: '0.85rem',
                        fontWeight: 500
                    }}>
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default QuickStatsSection;
