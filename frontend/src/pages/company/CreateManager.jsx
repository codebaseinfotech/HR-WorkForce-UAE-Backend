import { useState } from 'react';
import {
    Box,
    VStack,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Select,
    HStack,
    Text,
    InputGroup,
    InputLeftElement,
    Icon,
    SimpleGrid,
    Divider,
} from '@chakra-ui/react';
import { FiMail, FiUser, FiPhone, FiLock, FiBriefcase, FiUsers, FiCalendar, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateManagerMutation } from '../../store/apiSlice';

const CreateManager = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const [createManager, { isLoading }] = useCreateManagerMutation();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        designation: '',
        department: '',
        mobile: '',
        birthday: '',
        gender: '',
        nationality: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await createManager({
                ...formData,
                companyId: user.companyId,
                companyName: user.companyName,
                createdBy: user.id,
            }).unwrap();

            toast({
                title: 'Manager Created Successfully!',
                description: `${formData.firstName} ${formData.lastName} has been added as a manager`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            navigate('/company/managers');
        } catch (error) {
            toast({
                title: 'Error Creating Manager',
                description: error.data?.message || 'Failed to create manager',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* ── Hero Header ── */}
                <Box
                    bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    borderRadius="3xl"
                    p={{ base: 6, md: 8 }}
                    position="relative"
                    overflow="hidden"
                    boxShadow="xl"
                >
                    <Box position="absolute" top="-20%" right="-5%" w="300px" h="300px" bg="purple.500" opacity="0.1" filter="blur(60px)" borderRadius="full" />
                    <Box position="absolute" bottom="-20%" left="10%" w="200px" h="200px" bg="blue.500" opacity="0.1" filter="blur(40px)" borderRadius="full" />
                    
                    <Box position="relative" zIndex={1}>
                        <Heading size="xl" color="white" mb={2} letterSpacing="-0.02em">
                            Create New Manager
                        </Heading>
                        <Text color="whiteAlpha.800" fontSize="md">
                            Add a manager who can manage staff members in your company
                        </Text>
                    </Box>
                </Box>

                <Card border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
                    <form onSubmit={handleSubmit}>
                        <VStack align="stretch" spacing={8}>
                            {/* Personal Information */}
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                                    Personal Information
                                </Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">First Name</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiUser} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="John"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Last Name</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiUser} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Doe"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Mobile</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiPhone} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                placeholder="+971 XX XXX XXXX"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Birthday</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiCalendar} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="birthday"
                                                type="date"
                                                value={formData.birthday}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Gender</FormLabel>
                                        <Select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            placeholder="Select gender"
                                            size="lg"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Nationality</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMapPin} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="nationality"
                                                value={formData.nationality}
                                                onChange={handleChange}
                                                placeholder="e.g., UAE, India"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            <Divider />

                            {/* Account Information */}
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                                    Account Information
                                </Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Email</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMail} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="manager@company.com"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Password</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiLock} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Create strong password"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            <Divider />

                            {/* Job Information */}
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                                    Job Information
                                </Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Designation</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiBriefcase} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="designation"
                                                value={formData.designation}
                                                onChange={handleChange}
                                                placeholder="e.g., HR Manager, Operations Manager"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Department</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiUsers} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                placeholder="e.g., Human Resources, Operations"
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            {/* Submit Button */}
                            <HStack spacing={4} justify="flex-end" pt={4}>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/company/managers')}
                                    size="lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    isLoading={isLoading}
                                    loadingText="Creating Manager..."
                                    px={8}
                                >
                                    Create Manager
                                </Button>
                            </HStack>
                        </VStack>
                    </form>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default CreateManager;
