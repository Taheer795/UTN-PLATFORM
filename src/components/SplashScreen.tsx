import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '@/src/components/Logo';

interface SplashScreenProps {
  isLoading: boolean;
}

export default function SplashScreen({ isLoading }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1.0, 
              ease: [0.16, 1, 0.3, 1], // Premium brand cubic-bezier transition
              delay: 0.1
            }}
            className="flex flex-col items-center justify-center"
          >
            {/* Centered stacked white-on-black logo from reference image */}
            <Logo variant="stacked" height={160} light={true} className="sm:h-48" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
