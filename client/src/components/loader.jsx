import React, { useState, useEffect } from 'react';

/**
 * BBLoader component renders a customizable spinning loader animation
 * @component
 * @param {Object} props
 * @param {boolean} [props.loading=true] - Controls visibility of the loader
 * @param {string} [props.color="#007BFF"] - Color of the spinning circles
 * @param {number} [props.size=50] - Size of the loader in pixels
 * @param {Object} [props.style={}] - Additional styles to apply to the loader wrapper
 * @returns {JSX.Element|null} Animated loader or null if not loading
 */
const BBLoader = ({ loading = true, color = "#007BFF", size = 50, style = {} }) => {
    const [delayedLoading, setDelayedLoading] = useState(false);

    /**
     * Manages delayed visibility of loader to prevent flickering on quick loads
     * Uses 300ms delay before showing loader
     */
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

    /**
     * Generates styles for individual spinning circles
     * @param {number} i - Index of the circle (0-4)
     * @returns {Object} Style object for the circle
     */
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

    // Base wrapper styles with size and custom style props
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
                {/* Render 5 concentric spinning circles */}
                <div style={circleStyle(0)} />
                <div style={circleStyle(1)} />
                <div style={circleStyle(2)} />
                <div style={circleStyle(3)} />
                <div style={circleStyle(4)} />
                {/* Animation keyframes for spinning effect */}
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