import { Box } from '@chakra-ui/react';

/**
 * Card Component - Reusable container with consistent styling
 * 
 * @param {ReactNode} children - Content to display inside the card
 * @param {string} variant - elevated | outline | filled
 * @param {object} props - Additional Chakra UI Box props
 */
const Card = ({ children, variant = 'elevated', ...props }) => {
    const variants = {
        elevated: {
            bg: 'white',
            boxShadow: 'md',
            borderWidth: '1px',
            borderColor: 'gray.200',
        },
        outline: {
            bg: 'white',
            borderWidth: '1px',
            borderColor: 'gray.200',
        },
        filled: {
            bg: 'gray.50',
        },
    };

    return (
        <Box
            borderRadius="xl"
            p={6}
            {...variants[variant]}
            {...props}
        >
            {children}
        </Box>
    );
};

export default Card;
