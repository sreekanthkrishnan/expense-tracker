/**
 * Password Prompt Modal Component
 * 
 * SECURITY: Password is only stored in component state during input.
 * Password is never logged, persisted, or sent to any backend.
 * Password is cleared from memory after use.
 */

import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Icon } from './common/Icon';

interface PasswordPromptProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
  maxRetries?: number;
  retryCount?: number;
}

const PasswordPrompt = ({
  isOpen,
  onConfirm,
  onCancel,
  error,
  maxRetries = 3,
  retryCount = 0,
}: PasswordPromptProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clear password when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
      // Clear password after use (security best practice)
      setPassword('');
    }
  };

  const handleCancel = () => {
    // Clear password on cancel
    setPassword('');
    onCancel();
  };

  const remainingRetries = maxRetries - retryCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Password Required"
    >
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Icon name="Lock" size={24} className="mr-3" style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="text-gray-700 font-medium">
              This bank statement is password-protected.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Please enter the password to unlock and read the file.
            </p>
          </div>
        </div>
        <div>
          
          {remainingRetries < maxRetries && remainingRetries > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <Icon name="AlertTriangle" size={16} className="inline mr-1" />
                {remainingRetries} attempt{remainingRetries !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pr-10"
                placeholder="Enter PDF password"
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                <Icon
                  name={showPassword ? 'EyeInvisibleOutlined' : 'EyeOutlined'}
                  size={18}
                />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800 flex items-center">
                <Icon name="AlertTriangle" size={16} className="mr-2" />
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={!password.trim()}
            >
              Continue
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-600 flex items-start">
            <Icon name="Info" size={14} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Security Note:</strong> Your password is used only to unlock the PDF file.
              It is never stored, logged, or sent to any server. The password is cleared from memory
              immediately after use.
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordPrompt;
