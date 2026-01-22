"use client";

export default function Template({ children }) {
    return (
        <div className="page-wrapper">
            {children}
            <style jsx>{`
        .page-wrapper {
          animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          min-height: 100%;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
        </div>
    );
}
