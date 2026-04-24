
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

type Language = 'javascript' | 'python' | 'java';

interface CodeBlockProps {
  code: {
    javascript: string;
    python: string;
    java: string;
  };
}

// Add hljs to the window object for TypeScript
declare global {
  interface Window {
    hljs: any;
  }
}

const LanguageTab: React.FC<{
  lang: string;
  active: boolean;
  onClick: () => void;
}> = ({ lang, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-200 ${
      active
        ? 'bg-white text-primary border-b-2 border-primary'
        : 'bg-transparent text-gray-500 hover:bg-gray-200 border-b-2 border-transparent'
    }`}
  >
    {lang}
  </button>
);

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [activeLang, setActiveLang] = useState<Language>('javascript');
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      window.hljs.highlightElement(codeRef.current);
    }
  }, [activeLang, code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code[activeLang]);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const languageMap = {
      javascript: 'language-javascript',
      python: 'language-python',
      java: 'language-java'
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center bg-gray-100 px-4 py-0 border-b border-gray-200">
        <div className="flex">
          <LanguageTab
            lang="JavaScript"
            active={activeLang === 'javascript'}
            onClick={() => setActiveLang('javascript')}
          />
          <LanguageTab
            lang="Python"
            active={activeLang === 'python'}
            onClick={() => setActiveLang('python')}
          />
          <LanguageTab
            lang="Java"
            active={activeLang === 'java'}
            onClick={() => setActiveLang('java')}
          />
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
          aria-label="Copy code to clipboard"
        >
          {isCopied ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto rounded-b-lg p-4">
        <pre className="text-sm font-mono m-0 whitespace-pre-wrap">
          <code ref={codeRef} className={languageMap[activeLang]}>
            {code[activeLang]}
          </code>
        </pre>
      </div>
    </div>
  );
};