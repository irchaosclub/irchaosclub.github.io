import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '../ui/button';

interface Theme {
  name: string;
  id: string;
  preview: {
    bg: string;
    text: string;
    accent: string;
  };
}

const themes: Theme[] = [
  {
    name: 'Gruvbox Dark',
    id: 'gruvbox-dark',
    preview: {
      bg: '#1d2021',
      text: '#ebdbb2', 
      accent: '#8ec07c'
    }
  },
  {
    name: 'Gruvbox Light',
    id: 'gruvbox-light',
    preview: {
      bg: '#fbf1c7',
      text: '#3c3836',
      accent: '#427b58'
    }
  },
  {
    name: 'Solarized Dark',
    id: 'solarized-dark',
    preview: {
      bg: '#002b36',
      text: '#839496',
      accent: '#268bd2'
    }
  },
  {
    name: 'UwU',
    id: 'uwu',
    preview: {
      bg: '#ff69b4',
      text: '#f8a2c2', 
      accent: '#da70d6'
    }
  },
  {
    name: 'Light Mode',
    id: 'light',
    preview: {
      bg: '#ffffff',
      text: '#1a1a1a',
      accent: '#0070f3'
    }
  },
  {
    name: 'Oxocarbon',
    id: 'oxocarbon',
    preview: {
      bg: '#161616',
      text: '#f4f4f4',
      accent: '#33b1ff'
    }
  }
];

export default function ThemePicker() {
  const [currentTheme, setCurrentTheme] = useState<string>('gruvbox-dark');
  const [isOpen, setIsOpen] = useState(false);

  // Load theme from localStorage on mount (theme already applied by _document.tsx script)
  useEffect(() => {
    const savedTheme = localStorage.getItem('ircc-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    } else {
      // Set default state if no theme is saved
      setCurrentTheme('gruvbox-dark');
    }
  }, []);

  const applyTheme = (themeId: string) => {
    // Simple instant switch - no animations
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '');
    
    document.documentElement.classList.add(`theme-${themeId}`);
    
    // Save to localStorage
    localStorage.setItem('ircc-theme', themeId);
    setCurrentTheme(themeId);
    setIsOpen(false);
  };

  const currentThemeObj = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
        title="Change theme"
      >
        <Palette className="h-4 w-4" />
        <span className="sr-only">Theme picker</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme picker dropdown */}
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border bg-popover p-2 shadow-lg">
            <div className="space-y-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                >
                  {/* Theme preview circle */}
                  <div className="relative flex h-5 w-5 shrink-0">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: theme.preview.text }}
                    />
                    <div 
                      className="absolute inset-0.5 rounded-full"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    <div 
                      className="absolute inset-1 rounded-full"
                      style={{ backgroundColor: theme.preview.bg }}
                    />
                  </div>
                  
                  <span className="flex-1 text-left">{theme.name}</span>
                  
                  {currentTheme === theme.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}