import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const CheckInCheckOut = () => {
    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                <Box>
                    <Heading size="lg" mb={2}>
                        Check-in / Check-out Records
                    </Heading>
                    <Text color="gray.600">
                        View and manage staff attendance records with location tracking
                    </Text>
                </Box>

                <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" borderWidth={1}>
                    <Text color="gray.600">
                        Check-in/Check-out table with location data will be implemented here
                    </Text>
                </Box>
            </VStack>
        </DashboardLayout>
    );
};

export default CheckInCheckOut;
