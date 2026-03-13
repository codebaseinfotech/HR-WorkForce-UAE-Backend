import { Center, Spinner, VStack, Text } from '@chakra-ui/react';

/**
 * LoadingSpinner Component - Consistent loading state
 * 
 * @param {string} message - Loading message
 * @param {string} size - Spinner size (sm, md, lg, xl)
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'xl' }) => {
    return (
        <Center minH="400px">
            <VStack spacing={4}>
                <Spinner
                    size={size}
                    color="primary.600"
                    thickness="4px"
                    speed="0.65s"
                />
                <Text color="gray.600" fontSize="md" fontWeight="medium">
                    {message}
                </Text>
            </VStack>
        </Center>
    );
};

export default LoadingSpinner;
