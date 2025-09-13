import React from 'react';
import { Button } from '@/components/ui/button';

interface TextInputModalProps {
    show: boolean;
    textInput: string;
    setTextInput: (text: string) => void;
    onAdd: () => void;
    onCancel: () => void;
}

export const TextInputModal: React.FC<TextInputModalProps> = ({
    show,
    textInput,
    setTextInput,
    onAdd,
    onCancel
}) => {
    if (!show) return null;

    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-full mx-4">
                <h3 className="text-white font-semibold text-lg mb-4">Add Text</h3>
                
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your text..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onAdd();
                        } else if (e.key === 'Escape') {
                            onCancel();
                        }
                    }}
                />
                
                <div className="flex gap-3 mt-4">
                    <Button 
                        onClick={onAdd} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        ✅ Add Text
                    </Button>
                    <Button 
                        onClick={onCancel}
                        variant="outline" 
                        className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                        ❌ Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};
