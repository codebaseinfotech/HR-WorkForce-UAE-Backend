import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    VStack,
    Heading,
    Text,
    Input,
    Button,
    FormControl,
    FormLabel,
    useToast,
    HStack,
    PinInput,
    PinInputField,
    InputGroup,
    InputRightElement,
    Icon,
    Alert,
    AlertIcon,
    Image,
    Flex,
} from '@chakra-ui/react';
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import {
    useForgotPasswordMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
} from '../../store/apiSlice';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const toast = useToast();
    const navigate = useNavigate();

    // RTK Query mutations
    const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
    const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

    const steps = [
        { title: 'Email', description: 'Enter your email' },
        { title: 'Verify OTP', description: 'Check your email' },
        { title: 'New Password', description: 'Set new password' },
    ];

    // Step 1: Send OTP Email
    const handleSendOTP = async () => {
        if (!email) {
            toast({
                title: 'Email Required',
                description: 'Please enter your email address',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            const res = await forgotPassword({ email }).unwrap();
            toast({
                title: '✓ OTP Sent!',
                description: res.message || 'Check your email for the OTP code',
                status: 'success',
                duration: 5000,
            });
            setStep(2);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.data?.message || 'Failed to send OTP',
                status: 'error',
                duration: 4000,
            });
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            toast({
                title: 'Invalid OTP',
                description: 'Please enter the 6-digit OTP',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            await verifyOtp({ email, otp }).unwrap();
            toast({
                title: '✓ OTP Verified!',
                description: 'Now set your new password',
                status: 'success',
                duration: 3000,
            });
            setStep(3);
        } catch (error) {
            toast({
                title: 'Verification Failed',
                description: error.data?.message || 'Invalid or expired OTP',
                status: 'error',
                duration: 4000,
            });
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast({
                title: 'Password Required',
                description: 'Please enter and confirm your new password',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Passwords Don\'t Match',
                description: 'Please make sure both passwords match',
                status: 'error',
                duration: 3000,
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: 'Weak Password',
                description: 'Password must be at least 6 characters long',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        try {
            await resetPassword({
                email,
                otp,
                password: newPassword,
                password_confirmation: confirmPassword,
            }).unwrap();
            toast({
                title: '✓ Password Reset Successful!',
                description: 'You can now sign in with your new password',
                status: 'success',
                duration: 5000,
            });
            setTimeout(() => navigate('/signin'), 2000);
        } catch (error) {
            toast({
                title: 'Reset Failed',
                description: error.data?.message || 'Failed to reset password',
                status: 'error',
                duration: 4000,
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

    return (
        <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
            {/* Left Panel - Branding */}
            <Flex
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
                <Box position="absolute" top="-60px" right="-60px" w="200px" h="200px" borderRadius="full" bg="whiteAlpha.100" />
                <Box position="absolute" bottom="-80px" left="-40px" w="250px" h="250px" borderRadius="full" bg="whiteAlpha.100" />
                <Box position="absolute" top="40%" left="-30px" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.50" />

                <VStack spacing={6} zIndex={1} textAlign="center">
                    <Image
                        src="/logo.png"
                        alt="WorkForce UAE"
                        w={{ base: '120px', lg: '160px' }}
                        h="auto"
                        filter="brightness(0) invert(1)"
                    />
                    <VStack spacing={2}>
                        <Heading
                            color="white"
                            fontSize={{ base: '2xl', lg: '3xl' }}
                            fontWeight="800"
                            letterSpacing="-0.5px"
                        >
                            WorkForce UAE
                        </Heading>
                        <Text
                            color="whiteAlpha.800"
                            fontSize={{ base: 'sm', lg: 'md' }}
                            maxW="300px"
                            lineHeight="1.6"
                        >
                            Secure account recovery in 3 easy steps
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
                <Box w="full" maxW="480px">
                    <VStack spacing={7} align="stretch">
                        {/* Header */}
                        <VStack spacing={2} align="flex-start">
                            <Heading
                                fontSize={{ base: '2xl', md: '3xl' }}
                                fontWeight="800"
                                color="#000000"
                            >
                                Forgot Password
                            </Heading>
                            <Text color="#828282" fontSize="md">
                                Reset your password in 3 easy steps
                            </Text>
                        </VStack>

                        {/* Step Indicator */}
                        <HStack spacing={0} w="full">
                            {steps.map((s, index) => (
                                <HStack key={index} flex={1} spacing={0}>
                                    <VStack spacing={1}>
                                        <Flex
                                            w="36px"
                                            h="36px"
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
                                        >
                                            {s.title}
                                        </Text>
                                    </VStack>
                                    {index < steps.length - 1 && (
                                        <Box
                                            flex={1}
                                            h="2px"
                                            bg={step > index + 1 ? '#AC6AF2' : '#DEDEDE'}
                                            mx={2}
                                            mb={5}
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
                            {/* Step 1: Enter Email */}
                            {step === 1 && (
                                <VStack spacing={5} align="stretch">
                                    <Text color="#828282" textAlign="center" fontSize="sm" lineHeight="1.6">
                                        Enter your registered email address and we'll send you an OTP to reset your password
                                    </Text>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                            Email Address
                                        </FormLabel>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            size="lg"
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                                            {...inputStyles}
                                        />
                                    </FormControl>

                                    <Button
                                        size="lg"
                                        w="full"
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
                                        _active={{ bg: '#8840CC', transform: 'translateY(0)' }}
                                        transition="all 0.2s"
                                        onClick={handleSendOTP}
                                        isLoading={isSendingOtp}
                                        loadingText="Sending OTP..."
                                        leftIcon={<Icon as={FiMail} />}
                                    >
                                        Send OTP
                                    </Button>
                                </VStack>
                            )}

                            {/* Step 2: Verify OTP */}
                            {step === 2 && (
                                <VStack spacing={5} align="stretch">
                                    <Alert
                                        status="info"
                                        borderRadius="xl"
                                        bg="#AC6AF21A"
                                        border="1px solid"
                                        borderColor="#AC6AF2"
                                    >
                                        <AlertIcon color="#AC6AF2" />
                                        <Text fontSize="sm" color="#000000">
                                            OTP has been sent to <strong>{email}</strong>
                                        </Text>
                                    </Alert>

                                    <Text color="#828282" textAlign="center" fontSize="sm">
                                        Enter the 6-digit OTP code from your email
                                    </Text>

                                    <FormControl>
                                        <FormLabel
                                            textAlign="center"
                                            fontWeight="600"
                                            color="#000000"
                                            fontSize="sm"
                                        >
                                            Enter OTP
                                        </FormLabel>
                                        <HStack justify="center" spacing={3}>
                                            <PinInput
                                                otp
                                                size="lg"
                                                value={otp}
                                                onChange={setOtp}
                                                onComplete={handleVerifyOTP}
                                                focusBorderColor="#AC6AF2"
                                            >
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                                <PinInputField
                                                    bg="#F3F3F3"
                                                    border="1px solid"
                                                    borderColor="#DEDEDE"
                                                    borderRadius="xl"
                                                    _focus={{
                                                        borderColor: '#AC6AF2',
                                                        bg: '#FFFFFF',
                                                        boxShadow: '0 0 0 3px #AC6AF21A',
                                                    }}
                                                    fontWeight="700"
                                                    fontSize="xl"
                                                />
                                            </PinInput>
                                        </HStack>
                                    </FormControl>

                                    <VStack spacing={3}>
                                        <Button
                                            size="lg"
                                            w="full"
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
                                            _active={{ bg: '#8840CC', transform: 'translateY(0)' }}
                                            transition="all 0.2s"
                                            onClick={handleVerifyOTP}
                                            isLoading={isVerifying}
                                            loadingText="Verifying..."
                                        >
                                            Verify OTP
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            color="#AC6AF2"
                                            fontWeight="600"
                                            fontSize="sm"
                                            _hover={{ bg: '#AC6AF21A' }}
                                            onClick={() => setStep(1)}
                                        >
                                            Change Email
                                        </Button>
                                    </VStack>
                                </VStack>
                            )}

                            {/* Step 3: Set New Password */}
                            {step === 3 && (
                                <VStack spacing={5} align="stretch">
                                    <Text color="#828282" textAlign="center" fontSize="sm">
                                        Create a strong new password for your account
                                    </Text>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                            New Password
                                        </FormLabel>
                                        <InputGroup>
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                size="lg"
                                                {...inputStyles}
                                            />
                                            <InputRightElement h="full">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    _hover={{ bg: 'transparent' }}
                                                >
                                                    <Icon as={showPassword ? FiEyeOff : FiEye} color="#828282" />
                                                </Button>
                                            </InputRightElement>
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel fontWeight="600" color="#000000" fontSize="sm" mb={1.5}>
                                            Confirm Password
                                        </FormLabel>
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            size="lg"
                                            onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                            {...inputStyles}
                                        />
                                    </FormControl>

                                    <Button
                                        size="lg"
                                        w="full"
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
                                        _active={{ bg: '#8840CC', transform: 'translateY(0)' }}
                                        transition="all 0.2s"
                                        onClick={handleResetPassword}
                                        isLoading={isResetting}
                                        loadingText="Resetting..."
                                        leftIcon={<Icon as={FiLock} />}
                                    >
                                        Reset Password
                                    </Button>
                                </VStack>
                            )}
                        </Box>

                        {/* Back to Sign In */}
                        <Box textAlign="center">
                            <Link to="/signin">
                                <Button
                                    variant="ghost"
                                    color="#AC6AF2"
                                    fontWeight="600"
                                    _hover={{ bg: '#AC6AF21A' }}
                                    leftIcon={<Icon as={FiArrowLeft} />}
                                >
                                    Back to Sign In
                                </Button>
                            </Link>
                        </Box>

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

export default ForgotPassword;
