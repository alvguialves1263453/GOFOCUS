import { motion } from "framer-motion";

const LiquidBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505] mesh-gradient">
            <motion.div
                className="blur-blob bg-primary"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: "10%", left: "10%" }}
            />
            <motion.div
                className="blur-blob bg-accent"
                animate={{
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                    scale: [1.2, 1, 1.2],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ bottom: "10%", right: "10%" }}
            />
        </div>
    );
};

export default LiquidBackground;
