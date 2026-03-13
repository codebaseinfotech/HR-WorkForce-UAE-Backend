import { useState, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Select,
    Text,
    SimpleGrid,
    Divider,
    Icon,
    Avatar,
    Badge,
    Flex,
    InputGroup,
    InputLeftElement,
    Tooltip,
} from '@chakra-ui/react';
import {
    FiMail,
    FiUser,
    FiPhone,
    FiCalendar,
    FiArrowLeft,
    FiCamera,
    FiGlobe,
    FiShield,
    // FiBuilding,
    FiUpload,
    FiCheck,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetRolesQuery,
    useGetNationalitiesQuery,
    useSignupMutation,
} from '../../store/apiSlice';

const CreateUserByRole = () => {
    const { roleId } = useParams(); // optional: pre-select role from URL
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    // RTK Query
    const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
    const { data: natsResponse, isLoading: natsLoading } = useGetNationalitiesQuery();
    const [signup, { isLoading: isCreating }] = useSignupMutation();

    // File refs
    const profileRef = useRef();
    const signatureRef = useRef();

    // Form state
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: roleId || '',
        nationality_id: '',
        bod: '',
        gender: '',
        agree: '1',
    });
    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signatureName, setSignatureName] = useState('');

    const nationalities = natsResponse?.data || natsResponse || [];
    const selectedRole = roles.find(r => r.id === parseInt(form.role_id));

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    const handleSignatureImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSignatureFile(file);
            setSignatureName(file.name);
        }
    };

    const validate = () => {
        if (!form.first_name.trim()) return 'First name is required';
        if (!form.last_name.trim()) return 'Last name is required';
        if (!form.email.trim()) return 'Email is required';
        if (!form.phone.trim()) return 'Phone is required';
        if (!form.role_id) return 'Please select a role';
        if (!form.gender) return 'Please select gender';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            toast({ title: 'Validation Error', description: error, status: 'warning', duration: 3000, isClosable: true });
            return;
        }

        // Build multipart FormData
        const fd = new FormData();
        fd.append('first_name', form.first_name);
        fd.append('last_name', form.last_name);
        fd.append('email', form.email);
        fd.append('phone', form.phone);
        fd.append('company_id', user.companyId || '');
        fd.append('role_id', form.role_id);
        fd.append('nationality_id', form.nationality_id || '');
        fd.append('bod', form.bod || '');
        fd.append('gender', form.gender);
        fd.append('agree', '1');
        if (profileFile) fd.append('p_image', profileFile);
        if (signatureFile) fd.append('signature_image', signatureFile);

        try {
            await signup(fd).unwrap();
            toast({
                title: '✓ User Created Successfully!',
                description: `${form.first_name} ${form.last_name} has been added as ${selectedRole?.name || 'user'}`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
            navigate('/company/managers');
        } catch (err) {
            toast({
                title: 'Creation Failed',
                description: err.data?.message || 'Failed to create user',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (rolesLoading || natsLoading) {
        return <DashboardLayout><LoadingSpinner message="Loading form..." /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box
                    bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
                    borderRadius="2xl"
                    p={{ base: 5, md: 8 }}
                    position="relative"
                    overflow="hidden"
                >
                    <Box position="absolute" top="-30px" right="-30px" w="150px" h="150px" borderRadius="full" bg="whiteAlpha.100" />
                    <Box position="absolute" bottom="-20px" left="40%" w="100px" h="100px" borderRadius="full" bg="whiteAlpha.50" />
                    <Button
                        variant="unstyled"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        color="whiteAlpha.800"
                        fontSize="sm"
                        mb={4}
                        _hover={{ color: 'white' }}
                        onClick={() => navigate('/company/managers')}
                        h="auto"
                    >
                        <Icon as={FiArrowLeft} boxSize={4} />
                        Back to Managers
                    </Button>
                    <HStack spacing={4} position="relative" flexWrap="wrap">
                        <Box>
                            <Heading size="xl" color="white" mb={1} letterSpacing="-0.02em">
                                Create New User
                            </Heading>
                            <Text color="whiteAlpha.800" fontSize="md">
                                Fill in the details below to add a new member to your team
                            </Text>
                        </Box>
                        {/* Company + Role pills */}
                        <HStack spacing={2} ml={{ base: 0, md: 'auto' }} flexWrap="wrap">
                            <Badge
                                bg="whiteAlpha.200"
                                color="white"
                                px={3}
                                py={1.5}
                                borderRadius="full"
                                fontSize="xs"
                                fontWeight="600"
                            >
                                <HStack spacing={1.5}>
                                    {/* <Icon as={FiBuilding} boxSize={3} /> */}
                                    <Text>{user?.companyName || 'Company'}</Text>
                                </HStack>
                            </Badge>
                            {selectedRole && (
                                <Badge
                                    bg="whiteAlpha.200"
                                    color="white"
                                    px={3}
                                    py={1.5}
                                    borderRadius="full"
                                    fontSize="xs"
                                    fontWeight="600"
                                >
                                    <HStack spacing={1.5}>
                                        <Icon as={FiShield} boxSize={3} />
                                        <Text>{selectedRole.name}</Text>
                                    </HStack>
                                </Badge>
                            )}
                        </HStack>
                    </HStack>
                </Box>

                <form onSubmit={handleSubmit}>
                    <VStack align="stretch" spacing={5}>
                        {/* Profile Photo & Signature Upload */}
                        <Card>
                            <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>
                                Profile & Signature
                            </Text>
                            <Flex gap={6} flexWrap="wrap" align="center">
                                {/* Profile Photo */}
                                <VStack spacing={2}>
                                    <Box position="relative">
                                        <Avatar
                                            size="2xl"
                                            src={profilePreview}
                                            name={(form.first_name || form.last_name) ? `${form.first_name} ${form.last_name}` : 'User'}
                                            bg="purple.100"
                                            color="purple.600"
                                            cursor="pointer"
                                            onClick={() => profileRef.current.click()}
                                        />
                                        <Tooltip label="Upload Profile Photo">
                                            <Flex
                                                position="absolute"
                                                bottom={0}
                                                right={0}
                                                w="28px"
                                                h="28px"
                                                borderRadius="full"
                                                bg="purple.600"
                                                align="center"
                                                justify="center"
                                                cursor="pointer"
                                                onClick={() => profileRef.current.click()}
                                                border="2px solid white"
                                            >
                                                <Icon as={FiCamera} color="white" boxSize={3} />
                                            </Flex>
                                        </Tooltip>
                                    </Box>
                                    <Text fontSize="xs" color="gray.500">Profile Photo</Text>
                                    <input
                                        ref={profileRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={handleProfileImage}
                                    />
                                </VStack>

                                <Divider orientation="vertical" h="80px" display={{ base: 'none', md: 'block' }} />

                                {/* Signature Upload */}
                                <VStack align="start" spacing={2} flex={1} minW="200px">
                                    <Text fontSize="sm" fontWeight="600" color="gray.700">Signature Image</Text>
                                    <Box
                                        border="2px dashed"
                                        borderColor={signatureFile ? 'green.400' : 'gray.300'}
                                        borderRadius="xl"
                                        p={4}
                                        w="full"
                                        textAlign="center"
                                        cursor="pointer"
                                        bg={signatureFile ? 'green.50' : 'gray.50'}
                                        _hover={{ borderColor: 'purple.400', bg: 'purple.50' }}
                                        transition="all 0.2s"
                                        onClick={() => signatureRef.current.click()}
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={signatureFile ? FiCheck : FiUpload} boxSize={6} color={signatureFile ? 'green.500' : 'gray.400'} />
                                            <Text fontSize="xs" color={signatureFile ? 'green.600' : 'gray.500'} fontWeight="500">
                                                {signatureName || 'Click to upload signature'}
                                            </Text>
                                        </VStack>
                                    </Box>
                                    <input
                                        ref={signatureRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={handleSignatureImage}
                                    />
                                </VStack>
                            </Flex>
                        </Card>

                        {/* Personal Information */}
                        <Card>
                            <Text fontSize="md" fontWeight="700" color="gray.800" mb={5}>
                                Personal Information
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">First Name</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiUser} color="gray.400" /></InputLeftElement>
                                        <Input
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            placeholder="e.g. John"
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Last Name</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiUser} color="gray.400" /></InputLeftElement>
                                        <Input
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Patel"
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Email Address</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiMail} color="gray.400" /></InputLeftElement>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="user@email.com"
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Phone</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiPhone} color="gray.400" /></InputLeftElement>
                                        <Input
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="e.g. 1523698547"
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">Date of Birth</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiCalendar} color="gray.400" /></InputLeftElement>
                                        <Input
                                            name="bod"
                                            type="date"
                                            value={form.bod}
                                            onChange={handleChange}
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Gender</FormLabel>
                                    <Select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        placeholder="Select gender"
                                        size="lg"
                                        borderRadius="xl"
                                        focusBorderColor="purple.500"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">Nationality</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement><Icon as={FiGlobe} color="gray.400" /></InputLeftElement>
                                        <Select
                                            name="nationality_id"
                                            value={form.nationality_id}
                                            onChange={handleChange}
                                            placeholder="Select nationality"
                                            size="lg"
                                            borderRadius="xl"
                                            focusBorderColor="purple.500"
                                            pl="40px"
                                        >
                                        {nationalities.length > 0
                                            ? nationalities.map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))
                                            : [
                                                { id: '1', name: 'UAE' },
                                                { id: '2', name: 'India' },
                                                { id: '3', name: 'Pakistan' },
                                                { id: '4', name: 'Philippines' },
                                                { id: '5', name: 'Bangladesh' },
                                                { id: '6', name: 'Egypt' },
                                                { id: '7', name: 'Jordan' },
                                                { id: '8', name: 'Nepal' },
                                            ].map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))
                                        }
                                        </Select>
                                    </InputGroup>
                                </FormControl>
                            </SimpleGrid>
                        </Card>

                        {/* Role & Company */}
                        <Card>
                            <Text fontSize="md" fontWeight="700" color="gray.800" mb={5}>
                                Role & Company
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                {/* Company — read only from auth */}
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">Company</FormLabel>
                                    <Box
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="xl"
                                        px={4}
                                        py={3}
                                        bg="gray.50"
                                    >
                                        <HStack spacing={2}>
                                            {/* <Icon as={FiBuilding} color="gray.500" boxSize={4} /> */}
                                            <Text fontSize="sm" fontWeight="600" color="gray.700">{user?.companyName || '-'}</Text>
                                            <Badge colorScheme="gray" fontSize="2xs" ml="auto">ID: {user?.companyId}</Badge>
                                        </HStack>
                                    </Box>
                                    <Text fontSize="xs" color="gray.400" mt={1}>Auto-filled from your account</Text>
                                </FormControl>

                                {/* Role selector */}
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">Assign Role</FormLabel>
                                    <Select
                                        name="role_id"
                                        value={form.role_id}
                                        onChange={handleChange}
                                        placeholder="Select role"
                                        size="lg"
                                        borderRadius="xl"
                                        focusBorderColor="purple.500"
                                    >
                                        {roles
                                            .filter(r => r.slug !== 'super_admin')
                                            .map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                    {r.permissions?.length > 0 ? ` (${r.permissions.length} permissions)` : ''}
                                                </option>
                                            ))}
                                    </Select>
                                    {selectedRole && (
                                        <HStack mt={2} spacing={2}>
                                            <Icon as={FiShield} color="purple.500" boxSize={3.5} />
                                            <Text fontSize="xs" color="purple.600" fontWeight="500">
                                                {selectedRole.name} — Role ID: {selectedRole.id}
                                            </Text>
                                        </HStack>
                                    )}
                                </FormControl>
                            </SimpleGrid>
                        </Card>

                        {/* Actions */}
                        <HStack justify="flex-end" spacing={4} pt={2}>
                            <Button
                                variant="outline"
                                size="lg"
                                borderRadius="xl"
                                onClick={() => navigate('/company/managers')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                borderRadius="xl"
                                bgGradient="linear(to-r, purple.500, primary.500)"
                                color="white"
                                _hover={{ bgGradient: 'linear(to-r, purple.600, primary.600)', transform: 'translateY(-1px)', shadow: 'lg' }}
                                _active={{ transform: 'translateY(0)' }}
                                transition="all 0.2s"
                                px={10}
                                isLoading={isCreating}
                                loadingText="Creating..."
                                leftIcon={<FiCheck />}
                            >
                                Create User
                            </Button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </DashboardLayout>
    );
};

export default CreateUserByRole;
