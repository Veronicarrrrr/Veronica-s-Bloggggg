"use client";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 面板 */}
      <div
        className="modal-animate relative bg-[#1e1233] rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 shadow-2xl shadow-purple-900/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/15 sticky top-0 bg-[#1e1233] z-10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-purple-400/60 hover:text-white text-xl leading-none transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-500/20"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
