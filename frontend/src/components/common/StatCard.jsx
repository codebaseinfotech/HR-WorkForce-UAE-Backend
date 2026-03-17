import { Box, Stat, StatLabel, StatNumber, StatHelpText, Icon, HStack, Flex } from '@chakra-ui/react';

/**
 * StatCard Component - Premium stat card with icon, colored top bar, and hover animation
 * 
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} helpText - Helper text
 * @param {ReactElement} icon - Icon component
 * @param {string} colorScheme - Color scheme (primary, success, warning, error, info, purple)
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
            valueColor: 'gray.800',
            gradient: 'linear(to-r, primary.400, primary.600)',
        },
        success: {
            bg: 'success.50',
            iconBg: 'success.100',
            iconColor: 'success.600',
            valueColor: 'gray.800',
            gradient: 'linear(to-r, success.400, success.600)',
        },
        warning: {
            bg: 'warning.50',
            iconBg: 'warning.100',
            iconColor: 'warning.600',
            valueColor: 'gray.800',
            gradient: 'linear(to-r, warning.400, warning.600)',
        },
        error: {
            bg: 'error.50',
            iconBg: 'error.100',
            iconColor: 'error.600',
            valueColor: 'gray.800',
            gradient: 'linear(to-r, error.400, error.600)',
        },
        info: {
            bg: 'info.50',
            iconBg: 'blue.100', // Override since info scale might not have 50/100 defined properly everywhere
            iconColor: 'blue.600',
            valueColor: 'gray.800',
            gradient: 'linear(to-r, blue.400, blue.600)',
        },
        purple: {
            bg: 'purple.50',
            iconBg: 'purple.100',
            iconColor: 'purple.600',
            valueColor: 'gray.800',
            gradient: 'linear(to-r, purple.400, purple.600)',
        },
    };

    const scheme = colorSchemes[colorScheme] || colorSchemes.primary;

    return (
        <Box
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.100"
            position="relative"
            overflow="hidden"
            transition="all 0.3s cubic-bezier(.25,.8,.25,1)"
            _hover={{
                boxShadow: 'xl',
                transform: 'translateY(-3px)',
            }}
            {...props}
        >
            {/* Colored top bar */}
            <Box h="4px" bgGradient={scheme.gradient} w="100%" />
            
            <Box p={6}>
                <HStack spacing={5} alignItems="flex-start">
                    {/* Icon */}
                    {icon && (
                        <Flex
                            bg={scheme.iconBg}
                            p={3.5}
                            borderRadius="xl"
                            alignItems="center"
                            justifyContent="center"
                            shadow="sm"
                        >
                            <Icon as={icon} boxSize={7} color={scheme.iconColor} />
                        </Flex>
                    )}

                    {/* Stat Content */}
                    <Stat flex={1}>
                        <StatLabel
                            fontSize="xs"
                            fontWeight="700"
                            color="gray.500"
                            textTransform="uppercase"
                            letterSpacing="wider"
                            mb={1}
                        >
                            {label}
                        </StatLabel>
                        <StatNumber
                            fontSize="3xl"
                            fontWeight="800"
                            color={scheme.valueColor}
                            lineHeight="1"
                        >
                            {value}
                        </StatNumber>
                        {(helpText || trend) && (
                            <HStack mt={2} spacing={2}>
                                {trend && (
                                    <Box 
                                        as="span" 
                                        fontWeight="600" 
                                        color={trend > 0 ? 'green.500' : 'red.500'}
                                        fontSize="sm"
                                        display="flex"
                                        alignItems="center"
                                    >
                                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                                    </Box>
                                )}
                                {helpText && (
                                    <StatHelpText fontSize="sm" color="gray.500" mb={0} fontWeight="500">
                                        {helpText}
                                    </StatHelpText>
                                )}
                            </HStack>
                        )}
                    </Stat>
                </HStack>
            </Box>
        </Box>
    );
};

export default StatCard;
