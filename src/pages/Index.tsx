import { motion } from "framer-motion";

const INSTAGRAM_URL = "https://instagram.com/gofocus"; // Edite este link

const Index = () => {
  return (
    <>
      <head>
        <title>GoFocus — Fotografia Profissional</title>
        <meta name="description" content="GoFocus — Capturando momentos. Criando experiências. Agência de fotografia profissional." />
      </head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <motion.div
          className="flex flex-col items-center gap-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h1 className="font-display text-6xl font-light tracking-[0.2em] text-foreground sm:text-8xl md:text-9xl">
            GoFocus
          </h1>

          <motion.p
            className="font-display text-lg font-light italic tracking-wide text-muted-foreground sm:text-xl md:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Capturando momentos. Criando experiências.
          </motion.p>

          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 border border-foreground px-8 py-3 text-xs font-body uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Entrar em Contato
          </motion.a>
        </motion.div>

        <motion.div
          className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          © {new Date().getFullYear()} GoFocus
        </motion.div>
      </div>
    </>
  );
};

export default Index;
