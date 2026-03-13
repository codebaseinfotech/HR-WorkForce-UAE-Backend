import { extendTheme } from '@chakra-ui/react';

// Modern Professional Color Palette
const colors = {
    primary: {
        50: '#F5EAFF',
        100: '#E8D4FE',
        200: '#D5B0FD',
        300: '#C18CFB',
        400: '#B87AF7',
        500: '#AC6AF2',   // Main brand color - WorkForce UAE Purple
        600: '#9B54E0',   // Primary buttons, links
        700: '#8840CC',   // Hover states
        800: '#6F30A8',
        900: '#562387',
    },
    success: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981',   // Success states
        600: '#059669',
        700: '#047857',
        800: '#065F46',
        900: '#064E3B',
    },
    warning: {
        50: '#FFF7ED',
        100: '#FFEDD5',
        200: '#FED7AA',
        300: '#FDBA74',
        400: '#FB923C',
        500: '#F59E0B',   // Warning states
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },
    error: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        300: '#FCA5A5',
        400: '#F87171',
        500: '#EF4444',   // Error states
        600: '#DC2626',
        700: '#B91C1C',
        800: '#991B1B',
        900: '#7F1D1D',
    },
    info: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#3B82F6',   // Info states
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
    },
};

const theme = extendTheme({
    colors,

    // Typography
    fonts: {
        heading: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
        mono: `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`,
    },

    fontSizes: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        md: '1rem',         // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem',      // 48px
    },

    fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    // Spacing (already good in Chakra, but defining for consistency)
    space: {
        px: '1px',
        0.5: '0.125rem',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
    },

    // Border Radius
    radii: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
    },

    // Shadows
    shadows: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },

    // Component Styles
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'medium',
                borderRadius: 'md',
                _focus: {
                    boxShadow: 'none',
                    ring: '2px',
                    ringColor: 'primary.500',
                    ringOffset: '2px',
                },
            },
            sizes: {
                sm: {
                    h: '32px',
                    fontSize: 'sm',
                    px: 3,
                },
                md: {
                    h: '40px',
                    fontSize: 'md',
                    px: 4,
                },
                lg: {
                    h: '48px',
                    fontSize: 'lg',
                    px: 6,
                },
            },
            variants: {
                solid: (props) => ({
                    bg: props.colorScheme === 'primary' ? 'primary.600' : undefined,
                    color: 'white',
                    _hover: {
                        bg: props.colorScheme === 'primary' ? 'primary.700' : undefined,
                        _disabled: {
                            bg: props.colorScheme === 'primary' ? 'primary.600' : undefined,
                        },
                    },
                    _active: {
                        bg: props.colorScheme === 'primary' ? 'primary.800' : undefined,
                    },
                }),
                outline: (props) => ({
                    borderColor: props.colorScheme === 'primary' ? 'primary.600' : 'gray.300',
                    color: props.colorScheme === 'primary' ? 'primary.600' : 'gray.700',
                    _hover: {
                        bg: props.colorScheme === 'primary' ? 'primary.50' : 'gray.50',
                    },
                }),
                ghost: (props) => ({
                    color: props.colorScheme === 'primary' ? 'primary.600' : 'gray.600',
                    _hover: {
                        bg: props.colorScheme === 'primary' ? 'primary.50' : 'gray.100',
                    },
                }),
                danger: {
                    bg: 'error.500',
                    color: 'white',
                    _hover: {
                        bg: 'error.600',
                        _disabled: {
                            bg: 'error.500',
                        },
                    },
                },
            },
            defaultProps: {
                size: 'md',
                variant: 'solid',
                colorScheme: 'primary',
            },
        },

        Input: {
            baseStyle: {
                field: {
                    borderRadius: 'md',
                    _focus: {
                        borderColor: 'primary.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                    },
                },
            },
            sizes: {
                md: {
                    field: {
                        h: '40px',
                        fontSize: 'md',
                        px: 3,
                    },
                },
            },
            variants: {
                outline: {
                    field: {
                        borderColor: 'gray.300',
                        _hover: {
                            borderColor: 'gray.400',
                        },
                        _invalid: {
                            borderColor: 'error.500',
                            boxShadow: 'none',
                        },
                    },
                },
            },
            defaultProps: {
                variant: 'outline',
                focusBorderColor: 'primary.500',
            },
        },

        Select: {
            baseStyle: {
                field: {
                    borderRadius: 'md',
                },
            },
            defaultProps: {
                focusBorderColor: 'primary.500',
            },
        },

        Textarea: {
            baseStyle: {
                borderRadius: 'md',
            },
            defaultProps: {
                focusBorderColor: 'primary.500',
            },
        },

        Card: {
            baseStyle: {
                container: {
                    borderRadius: 'xl',
                    overflow: 'hidden',
                },
            },
            variants: {
                elevated: {
                    container: {
                        bg: 'white',
                        boxShadow: 'md',
                        borderWidth: '1px',
                        borderColor: 'gray.200',
                    },
                },
                outline: {
                    container: {
                        bg: 'white',
                        borderWidth: '1px',
                        borderColor: 'gray.200',
                    },
                },
                filled: {
                    container: {
                        bg: 'gray.50',
                    },
                },
            },
            defaultProps: {
                variant: 'elevated',
            },
        },

        Badge: {
            baseStyle: {
                px: 2,
                py: 0.5,
                borderRadius: 'md',
                fontSize: 'xs',
                fontWeight: 'medium',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            },
        },

        Table: {
            variants: {
                simple: {
                    th: {
                        fontWeight: 'semibold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: 'xs',
                        color: 'gray.600',
                        borderColor: 'gray.200',
                        bg: 'gray.50',
                    },
                    td: {
                        borderColor: 'gray.200',
                    },
                    tbody: {
                        tr: {
                            _hover: {
                                bg: 'gray.50',
                            },
                        },
                    },
                },
            },
        },

        Tabs: {
            variants: {
                line: {
                    tab: {
                        fontWeight: 'medium',
                        _selected: {
                            color: 'primary.600',
                            borderColor: 'primary.600',
                        },
                    },
                },
            },
        },

        Modal: {
            baseStyle: {
                dialog: {
                    borderRadius: 'xl',
                },
            },
        },
    },

    // Global styles
    styles: {
        global: {
            body: {
                bg: 'gray.50',
                color: 'gray.800',
            },
            '*::placeholder': {
                color: 'gray.400',
            },
            '*, *::before, *::after': {
                borderColor: 'gray.200',
            },
        },
    },

    config: {
        initialColorMode: 'light',
        useSystemColorMode: false,
    },
});

export default theme;
