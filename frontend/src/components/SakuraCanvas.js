import React, { useRef, useEffect } from 'react';

const SakuraCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const petals = [];
        const petalCount = 30; // Number of petals

        for (let i = 0; i < petalCount; i++) {
            petals.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 8 + 5,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 1 - 0.5
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            petals.forEach(petal => {
                ctx.save();
                ctx.globalAlpha = petal.opacity;
                ctx.translate(petal.x, petal.y);
                ctx.rotate((petal.rotation * Math.PI) / 180);

                // Draw a more realistic petal shape
                ctx.beginPath();
                // Start at the bottom point (stem)
                ctx.moveTo(0, petal.size);
                // Curve up to the top left
                ctx.bezierCurveTo(petal.size / 2, petal.size / 2, petal.size, -petal.size / 2, 0, -petal.size);
                // Notch at the top
                ctx.bezierCurveTo(-petal.size / 4, -petal.size * 0.8, -petal.size / 4, -petal.size * 0.8, 0, -petal.size * 0.6);
                // Curve down to the bottom
                ctx.moveTo(0, -petal.size);
                ctx.bezierCurveTo(-petal.size, -petal.size / 2, -petal.size / 2, petal.size / 2, 0, petal.size);

                // Using a simpler shape for better performance but recognizable look
                ctx.beginPath();
                ctx.moveTo(0, petal.size); // Bottom tip
                ctx.bezierCurveTo(petal.size * 0.8, 0, petal.size * 0.5, -petal.size, 0, -petal.size * 0.8); // Right side
                ctx.bezierCurveTo(0, -petal.size, 0, -petal.size, 0, -petal.size * 0.6); // Top notch center (simulated)
                ctx.bezierCurveTo(-petal.size * 0.5, -petal.size, -petal.size * 0.8, 0, 0, petal.size); // Left side

                // Gradient for petal
                const gradient = ctx.createLinearGradient(0, -petal.size, 0, petal.size);
                gradient.addColorStop(0, 'rgba(255, 240, 245, 0.9)'); // White/Pink tip
                gradient.addColorStop(1, 'rgba(255, 183, 197, 0.7)'); // Darker pink base

                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();

                // Update position with sway
                petal.x += petal.speedX + Math.sin(petal.y * 0.01) * 0.5; // Add swaying motion
                petal.y += petal.speedY;
                petal.rotation += petal.rotationSpeed;

                // Reset off-screen petals
                if (petal.y > canvas.height + 20) {
                    petal.y = -20;
                    petal.x = Math.random() * canvas.width;
                }
                if (petal.x > canvas.width + 20) {
                    petal.x = -20;
                }
                if (petal.x < -20) {
                    petal.x = canvas.width + 20;
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};

export default SakuraCanvas;
