import { useState, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    Checkbox,
    Link,
    Icon,
    HStack,
    SimpleGrid,
    Image,
    Flex,
} from '@chakra-ui/react';
import { FiMail, FiUser, FiCalendar, FiPhone, FiUpload, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useSignupMutation } from '../../store/apiSlice';

const SignUp = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [signup, { isLoading }] = useSignupMutation();

    const [step, setStep] = useState(1); // 1: Personal Info, 2: Additional Info

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '1',
        role_id: '1',
        nationality_id: '1',
        bod: '',
        gender: '',
    });

    const [agreeTerms, setAgreeTerms] = useState(false);

    // File refs
    const profileImageRef = useRef(null);
    const signatureImageRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const [signatureImage, setSignatureImage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Validate Step 1
    const handleContinue = () => {
        const { first_name, last_name, email, phone, bod, gender } = formData;
        if (!first_name || !last_name || !email || !phone || !bod || !gender) {
            toast({
                title: 'Please fill all fields',
                description: 'All personal information fields are required',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agreeTerms) {
            toast({
                title: 'Please accept terms and conditions',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            // Build FormData for multipart request
            const submitData = new FormData();
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('company_id', formData.company_id);
            submitData.append('role_id', formData.role_id);
            submitData.append('nationality_id', formData.nationality_id);
            submitData.append('bod', formData.bod);
            submitData.append('gender', formData.gender);
            submitData.append('agree', '1');

            // Attach files if selected
            if (profileImage) {
                submitData.append('p_image', profileImage);
            }
            if (signatureImage) {
                submitData.append('signature_image', signatureImage);
            }

            await signup(submitData).unwrap();

            toast({
                title: 'Request Submitted Successfully!',
                description: 'Your registration request has been sent. You will receive an email once approved.',
                status: 'success',
                duration: 6000,
                isClosable: true,
            });

            // Reset form
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                company_id: '1',
                role_id: '1',
                nationality_id: '1',
                bod: '',
                gender: '',
            });
            setAgreeTerms(false);
            setProfileImage(null);
            setSignatureImage(null);
            setStep(1);

            // Redirect to sign in after 2 seconds
            setTimeout(() => {
                navigate('/signin');
            }, 2000);
        } catch (error) {
            toast({
                title: 'Registration Request Failed',
                description: error?.data?.message || error?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    /* ── Shared input styles ── */
    const inputStyles = {
        bg: '#F3F3F3',
        border: '1px solid',
        borderColor: '#DEDEDE',
        borderRadius: 'xl',
        _hover: { borderColor: '#AC6AF2' },
        _focus: {
            borderColor: '#AC6AF2',
            bg: '#FFFFFF',
            boxShadow: '0 0 0 3px #AC6AF21A',
        },
        _placeholder: { color: '#828282' },
    };

    const stepInfo = [
        { title: 'Personal Info', description: 'Your details' },
        { title: 'Documents', description: 'Upload & submit' },
    ];

    return (
        <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
            {/* Left Panel - Branding */}
            <Flex
                w={{ base: '100%', lg: '38%' }}
                bg="#AC6AF2"
                direction="column"
                align="center"
                justify="center"
                py={{ base: 10, lg: 0 }}
                px={8}
                position="relative"
                overflow="hidden"
                minH={{ base: 'auto', lg: '100vh' }}
            >
                {/* Decorative circles */}
                <Box position="absolute" top="-60px" right="-60px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.100" />
                <Box position="absolute" bottom="-80px" left="-40px" w="250px" h="250px" borderRadius="full" bg="whiteAlpha.100" />
                <Box position="absolute" top="30%" left="-30px" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.50" />
                <Box position="absolute" bottom="20%" right="-20px" w="100px" h="100px" borderRadius="full" bg="whiteAlpha.50" />

                <VStack spacing={4} zIndex={1} textAlign="center" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '0' }}>
                    <Image
                        src="/logo.png"
                        alt="WorkForce UAE"
                        w={{ base: '100px', lg: '160px' }}
                        h="auto"
                        filter="brightness(0) invert(1)"
                    />

                    {/* Feature highlights */}
                    <VStack spacing={3} mt={2} display={{ base: 'none', lg: 'flex' }} color="whiteAlpha.900" fontSize="sm" fontWeight="500" textTransform="uppercase">
                        {['Staff Management', 'Attendance Tracking', 'Leave Management', 'Task Assignment'].map((feature) => (
                            <HStack key={feature} spacing={3}>
                                <Box w="6px" h="6px" borderRadius="full" bg="white" />
                                <Text color="whiteAlpha.900" fontSize="sm" fontWeight="500">
                                    {feature}
                                </Text>
                            </HStack>
                        ))}
                    </VStack>
                </VStack>
            </Flex>

            {/* Right Panel - Form */}
            <Flex
                w={{ base: '100%', lg: '62%' }}
                bg="#F9F9F9"
                align="flex-start"
                justify="center"
                py={{ base: 8, lg: 10 }}
                px={{ base: 5, md: 10, lg: 14 }}
                overflowY="auto"
            >
                <Box w="full" maxW="580px">
                    <VStack spacing={6} align="stretch">
                        {/* Header */}
                        <VStack spacing={2} align="flex-start">
                            <Heading
                                fontSize={{ base: '2xl', md: '3xl' }}
                                fontWeight="800"
                                color="#000000"
                            >
                                Sign Up
                            </Heading>
                            <Text color="#828282" fontSize="md">
                                Create your account to get started
                            </Text>
                        </VStack>

                        {/* Step Indicator */}
                        <HStack spacing={0} w="full" px={4}>
                            {stepInfo.map((s, index) => (
                                <HStack key={index} flex={1} spacing={0}>
                                    <VStack spacing={1}>
                                        <Flex
                                            w="40px"
                                            h="40px"
                                            borderRadius="full"
                                            align="center"
                                            justify="center"
                                            bg={step > index + 1 ? '#AC6AF2' : step === index + 1 ? '#AC6AF2' : '#F3F3F3'}
                                            color={step >= index + 1 ? '#FFFFFF' : '#828282'}
                                            fontWeight="700"
                                            fontSize="sm"
                                            transition="all 0.3s"
                                            boxShadow={step === index + 1 ? '0 0 0 4px #AC6AF21A' : 'none'}
                                        >
                                            {step > index + 1 ? <Icon as={FiCheck} /> : index + 1}
                                        </Flex>
                                        <Text
                                            fontSize="xs"
                                            fontWeight="600"
                                            color={step >= index + 1 ? '#AC6AF2' : '#828282'}
                                            textAlign="center"
                                            whiteSpace="nowrap"
                                        >
                                            {s.title}
                                        </Text>
                                    </VStack>
                                    {index < stepInfo.length - 1 && (
                                        <Box
                                            flex={1}
                                            h="3px"
                                            bg={step > index + 1 ? '#AC6AF2' : '#DEDEDE'}
                                            mx={3}
                                            mb={5}
                                            borderRadius="full"
                                            transition="all 0.3s"
                                        />
                                    )}
                                </HStack>
                            ))}
                        </HStack>

                        {/* Form Card */}
                        <Box
                            bg="#FFFFFF"
                            borderRadius="2xl"
                            p={{ base: 6, md: 8 }}
                            boxShadow="0 4px 24px rgba(0,0,0,0.06)"
                            border="1px solid"
                            borderColor="#DEDEDE"
                        >
                            {/* ═══════════ Step 1: Personal Information ═══════════ */}
                            {step === 1 && (
                                <VStack spacing={6}>
                                    <HStack spacing={2} w="full">
                                        <Box w="4px" h="20px" bg="#AC6AF2" borderRadius="full" />
                                        <Text fontSize="lg" fontWeight="700" color="#000000">
                                            Personal Information
                                        </Text>
                                    </HStack>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                First Name
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement pointerEvents="none" h="full">
                                                    <Icon as={FiUser} color="#828282" />
                                                </InputLeftElement>
                                                <Input
                                                    name="first_name"
                                                    placeholder="Amisha"
                                                    value={formData.first_name}
                                                    onChange={handleChange}
                                                    size="lg"
                                                    {...inputStyles}
                                                />
                                            </InputGroup>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Last Name
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement pointerEvents="none" h="full">
                                                    <Icon as={FiUser} color="#828282" />
                                                </InputLeftElement>
                                                <Input
                                                    name="last_name"
                                                    placeholder="Patel"
                                                    value={formData.last_name}
                                                    onChange={handleChange}
                                                    size="lg"
                                                    {...inputStyles}
                                                />
                                            </InputGroup>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Email
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement pointerEvents="none" h="full">
                                                    <Icon as={FiMail} color="#828282" />
                                                </InputLeftElement>
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    placeholder="your.email@company.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    size="lg"
                                                    {...inputStyles}
                                                />
                                            </InputGroup>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Phone Number
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement pointerEvents="none" h="full">
                                                    <Icon as={FiPhone} color="#828282" />
                                                </InputLeftElement>
                                                <Input
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="1523698547"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    size="lg"
                                                    {...inputStyles}
                                                />
                                            </InputGroup>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Date of Birth
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement pointerEvents="none" h="full">
                                                    <Icon as={FiCalendar} color="#828282" />
                                                </InputLeftElement>
                                                <Input
                                                    name="bod"
                                                    type="date"
                                                    value={formData.bod}
                                                    onChange={handleChange}
                                                    size="lg"
                                                    {...inputStyles}
                                                />
                                            </InputGroup>
                                        </FormControl>

                                        <FormControl isRequired>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Gender
                                            </FormLabel>
                                            <Select
                                                name="gender"
                                                placeholder="Select gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                size="lg"
                                                {...inputStyles}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </Select>
                                        </FormControl>

                                        <FormControl gridColumn={{ md: 'span 2' }}>
                                            <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                Nationality ID
                                            </FormLabel>
                                            <Select
                                                name="nationality_id"
                                                value={formData.nationality_id}
                                                onChange={handleChange}
                                                size="lg"
                                                {...inputStyles}
                                            >
                                                <option value="1">UAE</option>
                                                <option value="2">India</option>
                                                <option value="3">Pakistan</option>
                                                <option value="4">Philippines</option>
                                                <option value="5">Bangladesh</option>
                                                <option value="6">Egypt</option>
                                                <option value="7">Other</option>
                                            </Select>
                                        </FormControl>
                                    </SimpleGrid>

                                    {/* Continue Button */}
                                    <Button
                                        w="full"
                                        size="lg"
                                        bg="#AC6AF2"
                                        color="#FFFFFF"
                                        borderRadius="xl"
                                        h="52px"
                                        fontSize="md"
                                        fontWeight="700"
                                        _hover={{
                                            bg: '#9B54E0',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 6px 20px rgba(172,106,242,0.4)',
                                        }}
                                        _active={{
                                            bg: '#8840CC',
                                            transform: 'translateY(0)',
                                        }}
                                        transition="all 0.2s"
                                        onClick={handleContinue}
                                        rightIcon={<Icon as={FiArrowRight} />}
                                    >
                                        Continue
                                    </Button>
                                </VStack>
                            )}

                            {/* ═══════════ Step 2: Documents & Submit ═══════════ */}
                            {step === 2 && (
                                <form onSubmit={handleSubmit}>
                                    <VStack spacing={6}>
                                        <HStack spacing={2} w="full">
                                            <Box w="4px" h="20px" bg="#AC6AF2" borderRadius="full" />
                                            <Text fontSize="lg" fontWeight="700" color="#000000">
                                                Upload Documents
                                            </Text>
                                        </HStack>

                                        <VStack spacing={4} w="full">
                                            {/* Profile Image Upload */}
                                            <FormControl>
                                                <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                    Profile Image
                                                </FormLabel>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={profileImageRef}
                                                    display="none"
                                                    onChange={(e) => setProfileImage(e.target.files[0])}
                                                />
                                                <Button
                                                    w="full"
                                                    variant="outline"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    h="52px"
                                                    bg="#F3F3F3"
                                                    color={profileImage ? '#000000' : '#828282'}
                                                    fontWeight="500"
                                                    _hover={{ borderColor: '#AC6AF2', bg: '#FFFFFF' }}
                                                    leftIcon={<Icon as={FiUpload} color="#AC6AF2" />}
                                                    onClick={() => profileImageRef.current?.click()}
                                                >
                                                    {profileImage ? profileImage.name : 'Choose profile image'}
                                                </Button>
                                            </FormControl>

                                            {/* Signature Image Upload */}
                                            <FormControl>
                                                <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                                    Signature Image
                                                </FormLabel>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    ref={signatureImageRef}
                                                    display="none"
                                                    onChange={(e) => setSignatureImage(e.target.files[0])}
                                                />
                                                <Button
                                                    w="full"
                                                    variant="outline"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    h="52px"
                                                    bg="#F3F3F3"
                                                    color={signatureImage ? '#000000' : '#828282'}
                                                    fontWeight="500"
                                                    _hover={{ borderColor: '#AC6AF2', bg: '#FFFFFF' }}
                                                    leftIcon={<Icon as={FiUpload} color="#AC6AF2" />}
                                                    onClick={() => signatureImageRef.current?.click()}
                                                >
                                                    {signatureImage ? signatureImage.name : 'Choose signature image'}
                                                </Button>
                                            </FormControl>
                                        </VStack>

                                        {/* Divider */}
                                        <Box w="full" h="1px" bg="#DEDEDE" />

                                        {/* Terms and Conditions */}
                                        <Checkbox
                                            colorScheme="purple"
                                            isChecked={agreeTerms}
                                            onChange={(e) => setAgreeTerms(e.target.checked)}
                                            sx={{
                                                '.chakra-checkbox__control': {
                                                    borderRadius: '6px',
                                                    borderColor: '#DEDEDE',
                                                    _checked: {
                                                        bg: '#AC6AF2',
                                                        borderColor: '#AC6AF2',
                                                    },
                                                },
                                            }}
                                        >
                                            <Text fontSize="sm" color="#828282">
                                                I agree with{' '}
                                                <Link color="#AC6AF2" fontWeight="600">terms & conditions</Link> and{' '}
                                                <Link color="#AC6AF2" fontWeight="600">privacy policy</Link>
                                            </Text>
                                        </Checkbox>

                                        {/* Buttons */}
                                        <HStack spacing={3} w="full">
                                            <Button
                                                flex={1}
                                                size="lg"
                                                variant="outline"
                                                borderColor="#DEDEDE"
                                                color="#828282"
                                                borderRadius="xl"
                                                h="52px"
                                                fontSize="md"
                                                fontWeight="600"
                                                _hover={{
                                                    bg: '#F3F3F3',
                                                    borderColor: '#AC6AF2',
                                                    color: '#AC6AF2',
                                                }}
                                                transition="all 0.2s"
                                                onClick={() => setStep(1)}
                                                leftIcon={<Icon as={FiArrowLeft} />}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                flex={2}
                                                type="submit"
                                                size="lg"
                                                bg="#AC6AF2"
                                                color="#FFFFFF"
                                                borderRadius="xl"
                                                h="52px"
                                                fontSize="md"
                                                fontWeight="700"
                                                _hover={{
                                                    bg: '#9B54E0',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 6px 20px rgba(172,106,242,0.4)',
                                                }}
                                                _active={{
                                                    bg: '#8840CC',
                                                    transform: 'translateY(0)',
                                                }}
                                                transition="all 0.2s"
                                                isLoading={isLoading}
                                                loadingText="Submitting..."
                                            >
                                                Submit Request
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </form>
                            )}
                        </Box>

                        {/* Sign In Link */}
                        <HStack justify="center" spacing={1}>
                            <Text fontSize="sm" color="#828282">
                                Already have an account?
                            </Text>
                            <Link
                                as={RouterLink}
                                to="/signin"
                                color="#AC6AF2"
                                fontWeight="700"
                                fontSize="sm"
                                _hover={{ textDecoration: 'underline' }}
                            >
                                Sign In
                            </Link>
                        </HStack>

                        {/* Footer */}
                        <Text textAlign="center" fontSize="xs" color="#00000066">
                            © 2024 HR WorkForce UAE. All rights reserved.
                        </Text>
                    </VStack>
                </Box>
            </Flex>
        </Flex>
    );
};

export default SignUp;
