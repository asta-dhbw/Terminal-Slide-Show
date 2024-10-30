import React, { useState, useEffect } from 'react';

const BBLoader = ({ loading = true, color = "#007BFF", size = 50, style = {} }) => {
    const [delayedLoading, setDelayedLoading] = useState(false);
    // Delay the loading spinner to prevent flickering
    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => setDelayedLoading(true), 300);
        } else {
            setDelayedLoading(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    if (!delayedLoading) {
        return null;
    }

    if (!loading) {
        return null;
    }

    const circleStyle = (i) => ({
        position: "absolute",
        height: `${size * (1 - i / 10)}px`,
        width: `${size * (1 - i / 10)}px`,
        borderTop: `1px solid ${color}`,
        borderBottom: "none",
        borderLeft: `1px solid ${color}`,
        borderRight: "none",
        borderRadius: "100%",
        animation: `spin 1s ${(i * 0.2)}s infinite linear`,
    });

    const wrapperStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        ...style
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: size }}>
            <div style={wrapperStyle}>
                <div style={circleStyle(0)} />
                <div style={circleStyle(1)} />
                <div style={circleStyle(2)} />
                <div style={circleStyle(3)} />
                <div style={circleStyle(4)} />
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default BBLoader;