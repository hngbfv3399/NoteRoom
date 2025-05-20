import { motion, AnimatePresence } from "framer-motion";

function EmotionAnalysisModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const dropDownVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  return (
    <>
      {/* 배경 어둡게 (클릭 시 닫기) */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex justify-center items-start z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropDownVariants}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative"
              style={{ height: "80vh", marginTop: "10vh" }}
            >
              {/* 닫기 버튼 */}
              <button
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
              {/* 모달 내용 */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EmotionAnalysisModal;
