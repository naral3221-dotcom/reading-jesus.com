import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Slate 팔레트 (Primary Neutral)
  			slate: {
  				50: 'hsl(var(--slate-50))',
  				100: 'hsl(var(--slate-100))',
  				200: 'hsl(var(--slate-200))',
  				300: 'hsl(var(--slate-300))',
  				400: 'hsl(var(--slate-400))',
  				500: 'hsl(var(--slate-500))',
  				600: 'hsl(var(--slate-600))',
  				700: 'hsl(var(--slate-700))',
  				800: 'hsl(var(--slate-800))',
  				900: 'hsl(var(--slate-900))',
  			},
  			// Coral 팔레트 (Accent)
  			coral: {
  				50: 'hsl(var(--coral-50))',
  				100: 'hsl(var(--coral-100))',
  				200: 'hsl(var(--coral-200))',
  				300: 'hsl(var(--coral-300))',
  				400: 'hsl(var(--coral-400))',
  				500: 'hsl(var(--coral-500))',
  				600: 'hsl(var(--coral-600))',
  				700: 'hsl(var(--coral-700))',
  				800: 'hsl(var(--coral-800))',
  				900: 'hsl(var(--coral-900))',
  			},
  			// Sage 팔레트 (Secondary Accent)
  			sage: {
  				50: 'hsl(var(--sage-50))',
  				100: 'hsl(var(--sage-100))',
  				200: 'hsl(var(--sage-200))',
  				300: 'hsl(var(--sage-300))',
  				400: 'hsl(var(--sage-400))',
  				500: 'hsl(var(--sage-500))',
  				600: 'hsl(var(--sage-600))',
  			},
  			// QT 박스 컬러
  			qt: {
  				amber: {
  					DEFAULT: 'hsl(var(--qt-amber))',
  					bg: 'hsl(var(--qt-amber-bg))',
  					border: 'hsl(var(--qt-amber-border))',
  					text: 'hsl(var(--qt-amber-text))',
  				},
  				purple: {
  					DEFAULT: 'hsl(var(--qt-purple))',
  					bg: 'hsl(var(--qt-purple-bg))',
  					border: 'hsl(var(--qt-purple-border))',
  					text: 'hsl(var(--qt-purple-text))',
  				},
  				emerald: {
  					DEFAULT: 'hsl(var(--qt-emerald))',
  					bg: 'hsl(var(--qt-emerald-bg))',
  					border: 'hsl(var(--qt-emerald-border))',
  					text: 'hsl(var(--qt-emerald-text))',
  				},
  				sky: {
  					DEFAULT: 'hsl(var(--qt-sky))',
  					bg: 'hsl(var(--qt-sky-bg))',
  					border: 'hsl(var(--qt-sky-border))',
  					text: 'hsl(var(--qt-sky-text))',
  				},
  				indigo: {
  					DEFAULT: 'hsl(var(--qt-indigo))',
  					bg: 'hsl(var(--qt-indigo-bg))',
  					border: 'hsl(var(--qt-indigo-border))',
  					text: 'hsl(var(--qt-indigo-text))',
  				},
  			},
  			// 기존 olive/warm 호환성 (점진적 마이그레이션용)
  			olive: {
  				50: 'hsl(var(--slate-50))',
  				100: 'hsl(var(--slate-100))',
  				200: 'hsl(var(--slate-200))',
  				300: 'hsl(var(--slate-300))',
  				400: 'hsl(var(--slate-400))',
  				500: 'hsl(var(--slate-500))',
  				600: 'hsl(var(--slate-600))',
  				700: 'hsl(var(--slate-700))',
  				800: 'hsl(var(--slate-800))',
  				900: 'hsl(var(--slate-900))',
  			},
  			warm: {
  				50: 'hsl(var(--coral-50))',
  				100: 'hsl(var(--coral-100))',
  				200: 'hsl(var(--coral-200))',
  				300: 'hsl(var(--coral-300))',
  				400: 'hsl(var(--coral-400))',
  				500: 'hsl(var(--coral-500))',
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'soft': '0 2px 20px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
  			'soft-lg': '0 4px 30px -4px rgba(0, 0, 0, 0.1), 0 8px 20px -4px rgba(0, 0, 0, 0.06)',
  			'glow': '0 0 20px rgba(224, 122, 95, 0.2)',
  			'glow-sage': '0 0 20px rgba(129, 178, 154, 0.2)',
  		},
  		animation: {
  			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'slide-card': 'slideCard 0.4s ease-out',
  			'fade-in': 'fadeIn 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  		},
  		keyframes: {
  			'pulse-soft': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.7' },
  			},
  			'slideUp': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'slideDown': {
  				'0%': { opacity: '0', transform: 'translateY(-10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'slideCard': {
  				'0%': { opacity: '0', transform: 'translateX(20px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' },
  			},
  			'fadeIn': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			'scaleIn': {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			}
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};
export default config;
