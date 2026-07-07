/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
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
  			}
  		},
  		fontFamily: {
  			display: ['Chivo', 'system-ui', 'sans-serif'],
  			body: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
  			mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
  				to: { opacity: '1', transform: 'translateY(0) scale(1)' }
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.95)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			'slide-in-right': {
  				from: { opacity: '0', transform: 'translateX(20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'slide-in-left': {
  				from: { opacity: '0', transform: 'translateX(-20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'shimmer': {
  				from: { backgroundPosition: '-200% 0' },
  				to: { backgroundPosition: '200% 0' }
  			},
  			'pulse-soft': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.6' }
  			},
  			'glow': {
  				'0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.15)' },
  				'50%': { boxShadow: '0 0 40px rgba(239,68,68,0.3)' }
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-4px)' }
  			},
  			'ring-reset': {
  				'0%': { transform: 'scale(0.6)', opacity: '0.7' },
  				'100%': { transform: 'scale(1.6)', opacity: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-in-up': 'fade-in-up 0.4s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'slide-in-left': 'slide-in-left 0.3s ease-out',
  			'shimmer': 'shimmer 2s linear infinite',
  			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
  			'glow': 'glow 2s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
