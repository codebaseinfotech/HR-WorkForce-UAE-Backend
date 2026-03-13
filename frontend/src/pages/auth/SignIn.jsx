import {
    Box,
    Heading,
    Text,
    VStack,
    Input,
    Button,
    FormControl,
    FormLabel,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Icon,
    HStack,
    Image,
    Flex,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiSmartphone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useLoginMutation } from '../../store/apiSlice';
import { getDefaultDashboard } from '../../utils/roleConfig';

function SignIn() {
    const [emailData, setEmailData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { setUserFromResponse } = useAuth();
    const [login, { isLoading }] = useLoginMutation();
    const navigate = useNavigate();
    const toast = useToast();

    const handleEmailLogin = async (e) => {
        e.preventDefault();

        try {
            const result = await login({
                login: emailData.email,
                password: emailData.password,
            }).unwrap();

            // Store token and user data
            const token = result.token || result.data?.token;
            const userData = result.user || result.data?.user || result.data;
            setUserFromResponse(userData, token);

            // Determine role-based redirect
            const roleSlug = typeof userData?.role === 'object' ? userData.role?.slug : userData?.role;
            const defaultDashboard = getDefaultDashboard(roleSlug);

            toast({
                title: 'Login successful!',
                description: 'Welcome back to HR WorkForce UAE',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate(defaultDashboard);
        } catch (error) {
            toast({
                title: 'Login failed',
                description: error?.data?.message || error?.message || 'Invalid credentials',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
            {/* Left Panel - Branding */}
            <Flex
                display={{ base: 'flex', lg: 'flex' }}
                w={{ base: '100%', lg: '45%' }}
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
                <Box
                    position="absolute"
                    top="-60px"
                    right="-60px"
                    w="200px"
                    h="200px"
                    borderRadius="full"
                    bg="whiteAlpha.100"
                />
                <Box
                    position="absolute"
                    bottom="-80px"
                    left="-40px"
                    w="250px"
                    h="250px"
                    borderRadius="full"
                    bg="whiteAlpha.100"
                />
                <Box
                    position="absolute"
                    top="40%"
                    left="-30px"
                    w="120px"
                    h="120px"
                    borderRadius="full"
                    bg="whiteAlpha.50"
                />

                <VStack spacing={4} zIndex={1} textAlign="center">
                    <Image
                        src="/logo.png"
                        alt="WorkForce UAE"
                        w={{ base: '120px', lg: '160px' }}
                        h="auto"
                        filter="brightness(0) invert(1)"
                    />
                    <VStack spacing={2}>
                        <Text
                            color="whiteAlpha.800"
                            fontSize={{ base: 'sm', lg: 'md' }}
                            maxW="300px"
                            lineHeight="1.6"
                        >
                            Complete HR Management Solution for UAE Businesses
                        </Text>
                    </VStack>
                </VStack>
            </Flex>

            {/* Right Panel - Form */}
            <Flex
                w={{ base: '100%', lg: '55%' }}
                bg="#F9F9F9"
                align="center"
                justify="center"
                py={{ base: 8, lg: 0 }}
                px={{ base: 5, md: 10, lg: 16 }}
            >
                <Box w="full" maxW="460px">
                    <VStack spacing={7} align="stretch">
                        {/* Header */}
                        <VStack spacing={2} align="flex-start">
                            <Heading
                                fontSize={{ base: '2xl', md: '3xl' }}
                                fontWeight="800"
                                color="#000000"
                            >
                                Welcome Back 👋
                            </Heading>
                            <Text color="#828282" fontSize="md">
                                Sign in to access your workforce dashboard
                            </Text>
                        </VStack>

                        {/* Form Card */}
                        <Box
                            bg="#FFFFFF"
                            borderRadius="2xl"
                            p={{ base: 6, md: 8 }}
                            boxShadow="0 4px 24px rgba(0,0,0,0.06)"
                            border="1px solid"
                            borderColor="#DEDEDE"
                        >
                            <Tabs variant="soft-rounded" colorScheme="purple">
                                <TabList
                                    bg="#F3F3F3"
                                    p="4px"
                                    borderRadius="xl"
                                    mb={6}
                                >
                                    <Tab
                                        flex={1}
                                        fontSize="sm"
                                        fontWeight="600"
                                        _selected={{
                                            bg: '#AC6AF2',
                                            color: 'white',
                                            boxShadow: '0 2px 8px rgba(172,106,242,0.35)',
                                        }}
                                        borderRadius="lg"
                                        py={2.5}
                                    >
                                        <Icon as={FiMail} mr={2} />
                                        Email Login
                                    </Tab>
                                    <Tab
                                        flex={1}
                                        fontSize="sm"
                                        fontWeight="600"
                                        _selected={{
                                            bg: '#AC6AF2',
                                            color: 'white',
                                            boxShadow: '0 2px 8px rgba(172,106,242,0.35)',
                                        }}
                                        borderRadius="lg"
                                        py={2.5}
                                    >
                                        <Icon as={FiSmartphone} mr={2} />
                                        Mobile Login
                                    </Tab>
                                </TabList>

                                <TabPanels>
                                    <TabPanel px={0} pt={2}>
                                        <form onSubmit={handleEmailLogin}>
                                            <VStack spacing={5}>
                                                <FormControl isRequired>
                                                    <FormLabel
                                                        fontWeight="600"
                                                        color="#000000"
                                                        fontSize="sm"
                                                        mb={1.5}
                                                    >
                                                        Email Address
                                                    </FormLabel>
                                                    <InputGroup>
                                                        <InputLeftElement
                                                            pointerEvents="none"
                                                            h="full"
                                                        >
                                                            <Icon as={FiMail} color="#828282" />
                                                        </InputLeftElement>
                                                        <Input
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            size="lg"
                                                            bg="#F3F3F3"
                                                            border="1px solid"
                                                            borderColor="#DEDEDE"
                                                            borderRadius="xl"
                                                            _hover={{ borderColor: '#AC6AF2' }}
                                                            _focus={{
                                                                borderColor: '#AC6AF2',
                                                                bg: '#FFFFFF',
                                                                boxShadow: '0 0 0 3px #AC6AF21A',
                                                            }}
                                                            _placeholder={{ color: '#828282' }}
                                                            value={emailData.email}
                                                            onChange={(e) =>
                                                                setEmailData({ ...emailData, email: e.target.value })
                                                            }
                                                        />
                                                    </InputGroup>
                                                </FormControl>

                                                <FormControl isRequired>
                                                    <FormLabel
                                                        fontWeight="600"
                                                        color="#000000"
                                                        fontSize="sm"
                                                        mb={1.5}
                                                    >
                                                        Password
                                                    </FormLabel>
                                                    <InputGroup>
                                                        <InputLeftElement
                                                            pointerEvents="none"
                                                            h="full"
                                                        >
                                                            <Icon as={FiLock} color="#828282" />
                                                        </InputLeftElement>
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder="Enter your password"
                                                            size="lg"
                                                            bg="#F3F3F3"
                                                            border="1px solid"
                                                            borderColor="#DEDEDE"
                                                            borderRadius="xl"
                                                            _hover={{ borderColor: '#AC6AF2' }}
                                                            _focus={{
                                                                borderColor: '#AC6AF2',
                                                                bg: '#FFFFFF',
                                                                boxShadow: '0 0 0 3px #AC6AF21A',
                                                            }}
                                                            _placeholder={{ color: '#828282' }}
                                                            value={emailData.password}
                                                            onChange={(e) =>
                                                                setEmailData({ ...emailData, password: e.target.value })
                                                            }
                                                        />
                                                        <InputRightElement h="full">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                _hover={{ bg: 'transparent' }}
                                                            >
                                                                <Icon
                                                                    as={showPassword ? FiEyeOff : FiEye}
                                                                    color="#828282"
                                                                />
                                                            </Button>
                                                        </InputRightElement>
                                                    </InputGroup>
                                                </FormControl>

                                                {/* Forgot Password Link */}
                                                <Box w="full" textAlign="right">
                                                    <Link to="/forgot-password">
                                                        <Text
                                                            color="#AC6AF2"
                                                            fontSize="sm"
                                                            fontWeight="600"
                                                            _hover={{ textDecoration: 'underline' }}
                                                            cursor="pointer"
                                                        >
                                                            Forgot Password?
                                                        </Text>
                                                    </Link>
                                                </Box>

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    width="full"
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
                                                    loadingText="Signing in..."
                                                >
                                                    Sign In
                                                </Button>
                                            </VStack>
                                        </form>
                                    </TabPanel>

                                    <TabPanel px={0} pt={2}>
                                        <VStack spacing={5} py={10}>
                                            <Box
                                                p={4}
                                                bg="#AC6AF21A"
                                                borderRadius="2xl"
                                            >
                                                <Icon as={FiSmartphone} boxSize={10} color="#AC6AF2" />
                                            </Box>
                                            <Text color="#828282" textAlign="center" fontSize="md">
                                                Mobile login feature coming soon...
                                            </Text>
                                        </VStack>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </Box>

                        {/* Sign Up Link */}
                        <HStack justify="center" spacing={1}>
                            <Text fontSize="sm" color="#828282">
                                Don't have an account?
                            </Text>
                            <Text
                                as="span"
                                color="#AC6AF2"
                                cursor="pointer"
                                fontWeight="700"
                                fontSize="sm"
                                _hover={{ textDecoration: 'underline' }}
                                onClick={() => navigate('/signup')}
                            >
                                Sign Up
                            </Text>
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
}

export default SignIn;
