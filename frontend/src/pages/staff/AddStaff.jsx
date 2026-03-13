import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    InputGroup,
    InputLeftElement,
    Select,
    Icon,
    HStack,
    Avatar,
    IconButton,
    Textarea,
    SimpleGrid,
    Divider,
} from '@chakra-ui/react';
import { FiMail, FiUser, FiPhone, FiMapPin, FiCamera, FiCalendar, FiBriefcase, FiUsers } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AddStaff = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        countryCode: '+971',
        position: '',
        department: '',
        joiningDate: '',
        location: '',
        address: '',
        profileImage: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profileImage: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'profileImage' && formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add profile image if selected
            if (formData.profileImage) {
                formDataToSend.append('profileImage', formData.profileImage);
            }

            // Add company information
            if (user?.companyId) {
                formDataToSend.append('companyId', user.companyId);
            }
            if (user?.companyName) {
                formDataToSend.append('companyName', user.companyName);
            }

            await api.post('/staff/create', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast({
                title: 'Staff member added successfully!',
                description: 'The new staff member has been added to your workforce.',
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                mobile: '',
                countryCode: '+971',
                position: '',
                department: '',
                joiningDate: '',
                location: '',
                address: '',
                profileImage: null,
            });
            setImagePreview(null);
        } catch (error) {
            toast({
                title: 'Failed to add staff',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Header */}
                <Box>
                    <Heading
                        size="xl"
                        mb={2}
                        bgGradient="linear(to-r, primary.600, purple.600)"
                        bgClip="text"
                    >
                        Add New Staff Member
                    </Heading>
                    <Text color="gray.600" fontSize="lg">
                        Fill in the details below to add a new member to your workforce
                    </Text>
                </Box>

                <Card>
                    <form onSubmit={handleSubmit}>
                        <VStack align="stretch" spacing={8}>
                            {/* Profile Image */}
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                                    Profile Photo
                                </Text>
                                <HStack spacing={6} align="center">
                                    <Avatar
                                        size="2xl"
                                        src={imagePreview}
                                        name={`${formData.firstName} ${formData.lastName}`}
                                        bg="primary.100"
                                        color="primary.600"
                                    />
                                    <VStack align="start" spacing={2}>
                                        <Button
                                            as="label"
                                            htmlFor="profile-image"
                                            leftIcon={<FiCamera />}
                                            variant="outline"
                                            cursor="pointer"
                                            size="md"
                                        >
                                            Upload Photo
                                        </Button>
                                        <Input
                                            id="profile-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            display="none"
                                        />
                                        <Text fontSize="sm" color="gray.500">
                                            JPG, PNG or GIF (max. 2MB)
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Box>

                            <Divider />

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
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={handleChange}
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
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Email</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMail} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="john.doe@company.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Mobile</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiPhone} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="mobile"
                                                type="tel"
                                                placeholder="+971501234567"
                                                value={formData.mobile}
                                                onChange={handleChange}
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
                                        <FormLabel fontWeight="medium">Position</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiBriefcase} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="position"
                                                placeholder="Software Engineer"
                                                value={formData.position}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Department</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiUsers} color="gray.400" />
                                            </InputLeftElement>
                                            <Select
                                                name="department"
                                                placeholder="Select department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                size="lg"
                                            >
                                                <option value="IT">IT</option>
                                                <option value="HR">HR</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Operations">Operations</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Sales">Sales</option>
                                            </Select>
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Joining Date</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiCalendar} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="joiningDate"
                                                type="date"
                                                value={formData.joiningDate}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="medium">Location</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMapPin} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="location"
                                                placeholder="Dubai, UAE"
                                                value={formData.location}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl gridColumn={{ base: '1', md: '1 / -1' }}>
                                        <FormLabel fontWeight="medium">Address</FormLabel>
                                        <Textarea
                                            name="address"
                                            placeholder="Full address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={3}
                                            size="lg"
                                        />
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            {/* Submit Button */}
                            <HStack spacing={4} justify="flex-end" pt={4}>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    isLoading={loading}
                                    loadingText="Adding Staff..."
                                    px={8}
                                >
                                    Add Staff Member
                                </Button>
                            </HStack>
                        </VStack>
                    </form>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default AddStaff;
