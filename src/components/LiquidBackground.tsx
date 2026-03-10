import { motion } from "framer-motion";

const LiquidBackground = () => {
    // Verificamos se é um dispositivo móvel para simplificar a animação
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505] mesh-gradient">
            <motion.div
                className="blur-blob bg-primary"
                animate={isMobile ? {
                    x: [0, 30, 0],
                    y: [0, 20, 0],
                } : {
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: isMobile ? 30 : 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{ top: "10%", left: "10%", transform: "translateZ(0)" }}
            />
            <motion.div
                className="blur-blob bg-accent"
                animate={isMobile ? {
                    x: [0, -30, 0],
                    y: [0, 30, 0],
                } : {
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                    scale: [1.2, 1, 1.2],
                }}
                transition={{
                    duration: isMobile ? 35 : 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{ bottom: "10%", right: "10%", transform: "translateZ(0)" }}
            />
        </div>
    );
};


export default LiquidBackground;
