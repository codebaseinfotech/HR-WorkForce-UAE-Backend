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
    SimpleGrid,
    Divider,
    HStack,
    Alert,
    AlertIcon,
    AlertDescription,
    Image,
    Flex,
} from '@chakra-ui/react';
import { FiMail, FiUser, FiPhone, FiCalendar, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useCreateAndApproveCompanyMutation } from '../../store/apiSlice';

const CreateUser = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [createAndApproveCompany, { isLoading }] = useCreateAndApproveCompanyMutation();
    const [createdCredentials, setCreatedCredentials] = useState(null);

    // Calculate max allowed date of birth (must be at least 18 years old)
    const maxBod = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d.toISOString().split('T')[0];
    })();

    // File states
    const [logoFile, setLogoFile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [signatureImage, setSignatureImage] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [profilePreview, setProfilePreview] = useState('');
    const [signaturePreview, setSignaturePreview] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        first_name: '',
        last_name: '',
        city: '',
        nationality_id: '',
        address: '',
        gender: '',
        bod: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size — API limit is 2048 KB (2 MB)
        const maxSizeKB = 2048;
        if (file.size > maxSizeKB * 1024) {
            toast({
                title: 'File too large',
                description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 2MB.`,
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
            e.target.value = '';
            return;
        }

        const preview = URL.createObjectURL(file);
        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(preview);
        } else if (type === 'p_image') {
            setProfileImage(file);
            setProfilePreview(preview);
        } else if (type === 'signature_image') {
            setSignatureImage(file);
            setSignaturePreview(preview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreatedCredentials(null);

        try {
            // Build FormData matching API exactly
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('city', formData.city);
            submitData.append('nationality_id', formData.nationality_id);
            submitData.append('address', formData.address);
            submitData.append('gender', formData.gender);
            submitData.append('bod', formData.bod);

            if (logoFile) {
                submitData.append('logo', logoFile);
            }
            if (profileImage) {
                submitData.append('p_image', profileImage);
            }
            if (signatureImage) {
                submitData.append('signature_image', signatureImage);
            }

            const response = await createAndApproveCompany(submitData).unwrap();

            setCreatedCredentials({
                message: response.message || 'Company created successfully',
                company: response.company || response.data?.company,
                user: response.user || response.data?.user,
            });

            toast({
                title: 'Company Created Successfully!',
                description: response.message || `Company "${formData.name}" has been created`,
                status: 'success',
                duration: 6000,
                isClosable: true,
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                first_name: '',
                last_name: '',
                city: '',
                nationality_id: '',
                address: '',
                gender: '',
                bod: '',
            });
            setLogoFile(null);
            setProfileImage(null);
            setSignatureImage(null);
            setLogoPreview('');
            setProfilePreview('');
            setSignaturePreview('');

        } catch (error) {
            // Handle validation errors from API
            const errors = error.data?.errors;
            let description = error.data?.message || 'Something went wrong';
            if (errors) {
                const firstError = Object.values(errors)[0];
                description = Array.isArray(firstError) ? firstError[0] : firstError;
            }

            toast({
                title: 'Failed to create company',
                description,
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
                    borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden"
                >
                    <Box position="absolute" top="-50px" right="-50px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.50" />
                    <Box position="absolute" bottom="-30px" left="20%" w="140px" h="140px" borderRadius="full" bg="whiteAlpha.30" />

                    <Flex justify="space-between" align="flex-end" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" letterSpacing="wider" textTransform="uppercase" mb={1}>
                                Super Admin Panel
                            </Text>
                            <Heading size="xl" color="white" letterSpacing="-0.02em" mb={1}>
                                Create Company
                            </Heading>
                            <Text color="whiteAlpha.700" fontSize="sm">
                                Register a new company with owner details
                            </Text>
                        </Box>
                        
                        <Button
                            variant="outline"
                            color="white"
                            borderColor="whiteAlpha.400"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            onClick={() => navigate('/superadmin/company-requests')}
                        >
                            View All Requests
                        </Button>
                    </Flex>
                </Box>

                {/* Success Alert */}
                {createdCredentials && (
                    <Alert status="success" variant="left-accent" borderRadius="lg">
                        <AlertIcon />
                        <Box flex="1">
                            <AlertDescription>
                                <VStack align="start" spacing={2}>
                                    <Text fontWeight="bold">✅ {createdCredentials.message}</Text>
                                    {createdCredentials.company && (
                                        <Text fontSize="sm">
                                            <strong>Company:</strong> {createdCredentials.company.name || formData.name}
                                        </Text>
                                    )}
                                    {createdCredentials.user && (
                                        <Text fontSize="sm">
                                            <strong>Owner:</strong> {createdCredentials.user.first_name} {createdCredentials.user.last_name} ({createdCredentials.user.email})
                                        </Text>
                                    )}
                                </VStack>
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                <Card>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={6}>

                            {/* Company Information */}
                            <Box w="full">
                                <Text fontSize="lg" fontWeight="700" mb={4} color="gray.800" letterSpacing="-0.01em">
                                    Company Information
                                </Text>
                                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Company Name</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiBriefcase} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="name"
                                                placeholder="Nijweb Info"
                                                value={formData.name}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Company Email</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMail} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="nijweb@gmail.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Phone Number</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiPhone} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="phone"
                                                type="tel"
                                                placeholder="7894561237"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">City</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMapPin} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="city"
                                                placeholder="Surat"
                                                value={formData.city}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired gridColumn={{ md: 'span 2' }}>
                                        <FormLabel fontWeight="medium">Address</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiMapPin} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="address"
                                                placeholder="Mottavarachha"
                                                value={formData.address}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            <Divider />

                            {/* Owner / Personal Information */}
                            <Box w="full">
                                <Text fontSize="lg" fontWeight="700" mb={4} color="gray.800" letterSpacing="-0.01em">
                                    Owner Information
                                </Text>
                                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">First Name</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiUser} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="first_name"
                                                placeholder="Nilesh"
                                                value={formData.first_name}
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
                                                name="last_name"
                                                placeholder="Patel"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Date of Birth</FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={FiCalendar} color="gray.400" />
                                            </InputLeftElement>
                                            <Input
                                                name="bod"
                                                type="date"
                                                max={maxBod}
                                                value={formData.bod}
                                                onChange={handleChange}
                                                size="lg"
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Gender</FormLabel>
                                        <Select
                                            name="gender"
                                            placeholder="Select gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            size="lg"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="medium">Nationality ID</FormLabel>
                                        <Input
                                            name="nationality_id"
                                            type="number"
                                            placeholder="1"
                                            value={formData.nationality_id}
                                            onChange={handleChange}
                                            size="lg"
                                        />
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            <Divider />

                            {/* File Uploads */}
                            <Box w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
                                    Documents & Images
                                </Text>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    {/* Company Logo */}
                                    <FormControl>
                                        <FormLabel fontWeight="medium">Company Logo</FormLabel>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'logo')}
                                            size="lg"
                                            pt={1}
                                            sx={{
                                                '::file-selector-button': {
                                                    border: 'none',
                                                    bg: 'primary.50',
                                                    color: 'primary.700',
                                                    fontWeight: 'semibold',
                                                    borderRadius: 'md',
                                                    px: 3,
                                                    py: 1,
                                                    mr: 3,
                                                    cursor: 'pointer',
                                                }
                                            }}
                                        />
                                        {logoPreview && (
                                            <Image
                                                src={logoPreview}
                                                alt="Logo preview"
                                                mt={2}
                                                boxSize="80px"
                                                objectFit="cover"
                                                borderRadius="md"
                                                border="1px solid"
                                                borderColor="gray.200"
                                            />
                                        )}
                                    </FormControl>

                                    {/* Profile Image */}
                                    <FormControl>
                                        <FormLabel fontWeight="medium">Profile Image</FormLabel>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'p_image')}
                                            size="lg"
                                            pt={1}
                                            sx={{
                                                '::file-selector-button': {
                                                    border: 'none',
                                                    bg: 'primary.50',
                                                    color: 'primary.700',
                                                    fontWeight: 'semibold',
                                                    borderRadius: 'md',
                                                    px: 3,
                                                    py: 1,
                                                    mr: 3,
                                                    cursor: 'pointer',
                                                }
                                            }}
                                        />
                                        {profilePreview && (
                                            <Image
                                                src={profilePreview}
                                                alt="Profile preview"
                                                mt={2}
                                                boxSize="80px"
                                                objectFit="cover"
                                                borderRadius="md"
                                                border="1px solid"
                                                borderColor="gray.200"
                                            />
                                        )}
                                    </FormControl>

                                    {/* Signature Image */}
                                    <FormControl>
                                        <FormLabel fontWeight="medium">Signature Image</FormLabel>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'signature_image')}
                                            size="lg"
                                            pt={1}
                                            sx={{
                                                '::file-selector-button': {
                                                    border: 'none',
                                                    bg: 'primary.50',
                                                    color: 'primary.700',
                                                    fontWeight: 'semibold',
                                                    borderRadius: 'md',
                                                    px: 3,
                                                    py: 1,
                                                    mr: 3,
                                                    cursor: 'pointer',
                                                }
                                            }}
                                        />
                                        {signaturePreview && (
                                            <Image
                                                src={signaturePreview}
                                                alt="Signature preview"
                                                mt={2}
                                                h="60px"
                                                objectFit="contain"
                                                borderRadius="md"
                                                border="1px solid"
                                                borderColor="gray.200"
                                            />
                                        )}
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            <Divider />

                            {/* Submit Button */}
                            <HStack spacing={4} justify="flex-end" w="full" pt={4}>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/superadmin/users-list')}
                                    size="lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    isLoading={isLoading}
                                    loadingText="Creating Company..."
                                    px={8}
                                >
                                    Create Company
                                </Button>
                            </HStack>
                        </VStack>
                    </form>
                </Card>
            </VStack>
        </DashboardLayout>
    );
};

export default CreateUser;
