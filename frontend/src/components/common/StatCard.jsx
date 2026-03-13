import { Box, Stat, StatLabel, StatNumber, StatHelpText, Icon, HStack } from '@chakra-ui/react';

/**
 * StatCard Component - Modern stat card with icon and gradient
 * 
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} helpText - Helper text
 * @param {ReactElement} icon - Icon component
 * @param {string} colorScheme - Color scheme (primary, success, warning, error, info)
 */
const StatCard = ({
    label,
    value,
    helpText,
    icon,
    colorScheme = 'primary',
    trend,
    ...props
}) => {
    const colorSchemes = {
        primary: {
            bg: 'primary.50',
            iconBg: 'primary.100',
            iconColor: 'primary.600',
            valueColor: 'primary.600',
            gradient: 'linear(to-r, primary.50, primary.100)',
        },
        success: {
            bg: 'success.50',
            iconBg: 'success.100',
            iconColor: 'success.600',
            valueColor: 'success.600',
            gradient: 'linear(to-r, success.50, success.100)',
        },
        warning: {
            bg: 'warning.50',
            iconBg: 'warning.100',
            iconColor: 'warning.600',
            valueColor: 'warning.600',
            gradient: 'linear(to-r, warning.50, warning.100)',
        },
        error: {
            bg: 'error.50',
            iconBg: 'error.100',
            iconColor: 'error.600',
            valueColor: 'error.600',
            gradient: 'linear(to-r, error.50, error.100)',
        },
        info: {
            bg: 'info.50',
            iconBg: 'info.100',
            iconColor: 'info.600',
            valueColor: 'info.600',
            gradient: 'linear(to-r, info.50, info.100)',
        },
        purple: {
            bg: 'purple.50',
            iconBg: 'purple.100',
            iconColor: 'purple.600',
            valueColor: 'purple.600',
            gradient: 'linear(to-r, purple.50, purple.100)',
        },
    };

    const colors = colorSchemes[colorScheme] || colorSchemes.primary;

    return (
        <Box
            bg="white"
            borderRadius="xl"
            p={6}
            boxShadow="md"
            borderWidth="1px"
            borderColor="gray.200"
            position="relative"
            overflow="hidden"
            transition="all 0.2s"
            _hover={{
                boxShadow: 'lg',
                transform: 'translateY(-2px)',
            }}
            {...props}
        >
            {/* Gradient background */}
            <Box
                position="absolute"
                top={0}
                right={-10}
                w="150px"
                h="150px"
                bgGradient={colors.gradient}
                opacity={0.3}
                borderRadius="full"
                filter="blur(40px)"
            />

            <HStack spacing={4} position="relative" zIndex={1}>
                {/* Icon */}
                {icon && (
                    <Box
                        bg={colors.iconBg}
                        p={3}
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon as={icon} boxSize={6} color={colors.iconColor} />
                    </Box>
                )}

                {/* Stat Content */}
                <Stat flex={1}>
                    <StatLabel
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                        textTransform="uppercase"
                        letterSpacing="wide"
                    >
                        {label}
                    </StatLabel>
                    <StatNumber
                        fontSize="3xl"
                        fontWeight="bold"
                        color={colors.valueColor}
                        mt={1}
                    >
                        {value}
                    </StatNumber>
                    {helpText && (
                        <StatHelpText fontSize="sm" color="gray.500" mb={0}>
                            {helpText}
                        </StatHelpText>
                    )}
                    {trend && (
                        <StatHelpText fontSize="sm" color={trend > 0 ? 'success.500' : 'error.500'} mb={0}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </StatHelpText>
                    )}
                </Stat>
            </HStack>
        </Box>
    );
};

export default StatCard;
