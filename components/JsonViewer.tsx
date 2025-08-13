import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface JsonViewerProps {
  data: object;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const formattedJson = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(formattedJson).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
  };

  return (
    <div className="p-5 flex-grow">
        <div className="relative bg-tesla-gray-900 rounded-lg shadow-inner">
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-tesla-gray-700/50 hover:bg-tesla-gray-600 rounded-lg text-tesla-gray-300 hover:text-white transition-all duration-150 active:scale-95 z-10"
                aria-label="Copy JSON to clipboard"
            >
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
            <pre className="p-4 text-sm text-white overflow-x-auto max-h-[70vh] rounded-lg">
                <code className="font-mono">
                {formattedJson}
                </code>
            </pre>
        </div>
    </div>
  );
};

export default JsonViewer;