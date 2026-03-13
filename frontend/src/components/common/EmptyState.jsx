import { Center, VStack, Text, Icon, Button } from '@chakra-ui/react';
import { FiInbox } from 'react-icons/fi';

/**
 * EmptyState Component - Consistent empty state UI
 * 
 * @param {string} title - Main title
 * @param {string} description - Description text
 * @param {ReactElement} icon - Icon component
 * @param {ReactElement} action - Action button
 */
const EmptyState = ({
    title = 'No data found',
    description,
    icon = FiInbox,
    action,
    ...props
}) => {
    return (
        <Center py={12} {...props}>
            <VStack spacing={4} textAlign="center">
                <Icon
                    as={icon}
                    boxSize={12}
                    color="gray.300"
                />
                <VStack spacing={2}>
                    <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color="gray.700"
                    >
                        {title}
                    </Text>
                    {description && (
                        <Text
                            fontSize="sm"
                            color="gray.500"
                            maxW="sm"
                        >
                            {description}
                        </Text>
                    )}
                </VStack>
                {action && action}
            </VStack>
        </Center>
    );
};

export default EmptyState;
