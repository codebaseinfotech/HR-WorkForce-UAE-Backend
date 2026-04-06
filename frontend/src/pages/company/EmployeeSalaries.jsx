import React, { useState } from 'react';
import {
    Box, Button, Flex, HStack, Text, VStack, Heading, Center, Icon,
    useDisclosure, useToast, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
    FormControl, FormLabel, Input, Select, Badge, IconButton, Avatar,
    InputGroup, InputLeftAddon
} from '@chakra-ui/react';
import { FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiDownload } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetEmployeeSalariesQuery,
    useAddUpdateEmployeeSalaryMutation,
    useDeleteEmployeeSalaryMutation,
    useGetStaffQuery,
    // useLazyDownloadPdfSalarySlipQuery
} from '../../store/apiSlice';

const EmployeeSalaries = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;

    // Fetch lists
    const { data: salariesData, isLoading: isLoadingSalaries, refetch: refetchSalaries } = useGetEmployeeSalariesQuery({ company_id: companyId });
    const salaries = salariesData?.data?.data || []; // Note: paginated response might wrap in data.data

    const { data: staffData, isLoading: isLoadingStaff } = useGetStaffQuery(companyId);
    const staffList = staffData?.data || [];

    // Mutations
    const [addUpdateSalary, { isLoading: isSaving }] = useAddUpdateEmployeeSalaryMutation();
    const [deleteSalary] = useDeleteEmployeeSalaryMutation();
    // const [triggerPdfDownload, { isFetching: isDownloading }] = useLazyDownloadPdfSalarySlipQuery();

    // Modals state
    const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
    const { isOpen: isPdfOpen, onOpen: onPdfOpen, onClose: onPdfClose } = useDisclosure();
    
    const toast = useToast();

    // Form states
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        user_id: '',
        salary_type: 'monthly',
        amount: '',
        overtime_rate_per_hour: '',
        effective_from: '',
        effective_to: ''
    });

    const [pdfData, setPdfData] = useState({ user_id: '', month: '' });

    const handleOpenForm = (salary = null) => {
        if (salary) {
            setEditingId(salary.id);
            const amt = salary.salary_type === 'monthly' ? salary.monthly_salary 
                        : salary.salary_type === 'daily' ? salary.daily_salary 
                        : salary.hourly_salary;
            
            setFormData({
                user_id: salary.user_id?.toString() || '',
                salary_type: salary.salary_type || 'monthly',
                amount: amt || '',
                overtime_rate_per_hour: salary.overtime_rate_per_hour || '',
                effective_from: salary.effective_from ? salary.effective_from.split(' ')[0] : '',
                effective_to: salary.effective_to ? salary.effective_to.split(' ')[0] : ''
            });
        } else {
            setEditingId(null);
            setFormData({
                user_id: '', salary_type: 'monthly', amount: '',
                overtime_rate_per_hour: '', effective_from: '', effective_to: ''
            });
        }
        onFormOpen();
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                id: editingId,
                company_id: companyId,
                user_id: parseInt(formData.user_id, 10),
                salary_type: formData.salary_type,
                monthly_salary: formData.salary_type === 'monthly' ? formData.amount : null,
                daily_salary: formData.salary_type === 'daily' ? formData.amount : null,
                hourly_salary: formData.salary_type === 'hourly' ? formData.amount : null,
                overtime_rate_per_hour: formData.overtime_rate_per_hour || null,
                effective_from: formData.effective_from,
                effective_to: formData.effective_to || null
            };

            await addUpdateSalary(payload).unwrap();
            toast({ title: 'Salary structure saved', status: 'success', duration: 3000, isClosable: true });
            onFormClose();
            refetchSalaries();
        } catch (error) {
            toast({
                title: 'Error saving salary',
                description: error.data?.message || 'Check for overlapping date ranges.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this salary structure?')) {
            try {
                await deleteSalary(id).unwrap();
                toast({ title: 'Deleted successfully', status: 'success', duration: 3000, isClosable: true });
                refetchSalaries();
            } catch (err) {
                toast({ title: 'Delete failed', description: err?.data?.message, status: 'error', duration: 3000, isClosable: true });
            }
        }
    };

    const handlePdfSubmit = async (e) => {
        e.preventDefault();
        try {
            const blob = ""
            // await triggerPdfDownload({
            //     company_id: companyId,
            //     user_id: pdfData.user_id,
            //     month: pdfData.month
            // }).unwrap();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payslip_${pdfData.month}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            toast({ title: 'Payslip generated successfully', status: 'success', duration: 3000, isClosable: true });
            onPdfClose();
        } catch (err) {
            toast({
                title: 'PDF Generation Failed',
                description: err?.data?.message || 'Ensure the employee has a valid work schedule and salary structure for this month.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const getStaffDetails = (userId) => {
        return staffList.find(s => s.id === parseInt(userId, 10));
    };

    const formatAmount = (salary) => {
        if (salary.salary_type === 'monthly') return `${salary.monthly_salary} /mo`;
        if (salary.salary_type === 'daily') return `${salary.daily_salary} /day`;
        if (salary.salary_type === 'hourly') return `${salary.hourly_salary} /hr`;
        return 'N/A';
    };

    if (isLoadingSalaries || isLoadingStaff) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading payroll data..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box bgGradient="linear(135deg, #0ba360 0%, #3cba92 100%)" borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.200" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.200" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.300" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiDollarSign} boxSize={6} color="white" />
                                </Center>
                                <Heading size="lg" color="white" letterSpacing="-0.02em">Employee Salaries & Payroll</Heading>
                            </HStack>
                            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="500">Manage salary structures, OT rates, and generate payslips</Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button variant="outline" color="white" _hover={{ bg: 'whiteAlpha.200' }} borderColor="whiteAlpha.300" onClick={refetchSalaries} leftIcon={<Icon as={FiRefreshCw} />} size="sm">
                                Refresh
                            </Button>
                            <Button leftIcon={<FiDownload />} size="sm" onClick={() => { setPdfData({ user_id: '', month: '' }); onPdfOpen(); }} colorScheme="green" bg="green.600" color="white" _hover={{ bg: 'green.700', transform: 'translateY(-1px)' }}>
                                Generate Payslip
                            </Button>
                            <Button leftIcon={<FiPlus />} size="sm" onClick={() => handleOpenForm()} colorScheme="teal" bg="white" color="teal.700" _hover={{ bg: 'gray.50', transform: 'translateY(-1px)', shadow: 'md' }}>
                                Add Salary Structure
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {salaries.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title="No Salary Structures Found"
                            description="You haven't defined any salaries. Create one to be able to generate payslips."
                            icon={FiDollarSign}
                            action={
                                <Button leftIcon={<FiPlus />} onClick={() => handleOpenForm()} mt={4} colorScheme="teal">
                                    Create First Record
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm">
                        <Box overflowX="auto">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Employee</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Type</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-right">Base Pay</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-right">OT Rate (Hr)</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Effective Dates</th>
                                        <th className="bg-teal-50 text-teal-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {salaries.map((salary) => {
                                        const staff = getStaffDetails(salary.user_id);
                                        return (
                                            <tr key={salary.id} className="hover:bg-teal-50/30 transition-colors duration-150 odd:bg-white even:bg-gray-50">
                                                <td className="py-4 px-6">
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" name={staff ? `${staff.firstName} ${staff.lastName}` : `User ${salary.user_id}`} src={staff?.p_image_url} />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="600" color="gray.800">{staff ? `${staff.firstName} ${staff.lastName}` : `User #${salary.user_id}`}</Text>
                                                            <Text fontSize="xs" color="gray.500">{staff?.position?.name || 'Employee'}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge colorScheme={salary.salary_type === 'monthly' ? 'blue' : salary.salary_type === 'hourly' ? 'orange' : 'green'} borderRadius="full" px={2} textTransform="capitalize">
                                                        {salary.salary_type}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <Text fontWeight="700" color="gray.700">{formatAmount(salary)}</Text>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <Text fontWeight="600" color="gray.500">{salary.overtime_rate_per_hour || 'N/A'}</Text>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <VStack spacing={0}>
                                                        <Text fontSize="sm" fontWeight="500" color="gray.700">{salary.effective_from}</Text>
                                                        <Text fontSize="xs" color="gray.400">to {salary.effective_to || 'Present'}</Text>
                                                    </VStack>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <HStack spacing={2} justify="center">
                                                        <IconButton icon={<FiEdit2 />} size="sm" variant="ghost" colorScheme="blue" aria-label="Edit Salary" onClick={() => handleOpenForm(salary)} />
                                                        <IconButton icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" aria-label="Delete Salary" onClick={() => handleDelete(salary.id)} />
                                                    </HStack>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    </Card>
                )}
            </VStack>

            {/* Create/Edit Salary Form Modal */}
            <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" boxShadow="xl">
                    <form onSubmit={handleFormSubmit}>
                        <ModalHeader borderBottomWidth="1px" pb={4}>
                            {editingId ? 'Edit Salary Structure' : 'Add Salary Structure'}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Employee</FormLabel>
                                    <Select 
                                        placeholder="Select an employee" 
                                        value={formData.user_id} 
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                        bg="gray.50"
                                    >
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.firstName} {staff.lastName} - {staff.position?.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <HStack w="full" spacing={4} align="start">
                                    <FormControl isRequired w="50%">
                                        <FormLabel fontWeight="600" color="gray.700">Salary Type</FormLabel>
                                        <Select 
                                            value={formData.salary_type} 
                                            onChange={(e) => setFormData({ ...formData, salary_type: e.target.value })}
                                            bg="gray.50"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="daily">Daily</option>
                                            <option value="hourly">Hourly</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl isRequired w="50%">
                                        <FormLabel fontWeight="600" color="gray.700">Base Amount</FormLabel>
                                        <InputGroup>
                                            <InputLeftAddon children="$" />
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                value={formData.amount} 
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                bg="gray.50"
                                            />
                                        </InputGroup>
                                    </FormControl>
                                </HStack>

                                <FormControl>
                                    <FormLabel fontWeight="600" color="gray.700">Overtime Rate (Per Hour)</FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon children="$" />
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            placeholder="Leave empty if N/A"
                                            value={formData.overtime_rate_per_hour} 
                                            onChange={(e) => setFormData({ ...formData, overtime_rate_per_hour: e.target.value })}
                                            bg="gray.50"
                                        />
                                    </InputGroup>
                                </FormControl>

                                <HStack w="full" spacing={4} align="start">
                                    <FormControl isRequired w="50%">
                                        <FormLabel fontWeight="600" color="gray.700">Effective From</FormLabel>
                                        <Input 
                                            type="date" 
                                            value={formData.effective_from} 
                                            onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                                            bg="gray.50"
                                        />
                                    </FormControl>

                                    <FormControl w="50%">
                                        <FormLabel fontWeight="600" color="gray.700">Effective To (Optional)</FormLabel>
                                        <Input 
                                            type="date" 
                                            value={formData.effective_to} 
                                            onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                                            bg="gray.50"
                                        />
                                    </FormControl>
                                </HStack>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTopWidth="1px" pt={4} bg="gray.50" borderBottomRadius="xl">
                            <Button variant="ghost" mr={3} onClick={onFormClose}>Cancel</Button>
                            <Button colorScheme="teal" type="submit" isLoading={isSaving} loadingText="Saving...">
                                {editingId ? 'Update' : 'Save'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Generate PDF Modal */}
            <Modal isOpen={isPdfOpen} onClose={onPdfClose}>
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" boxShadow="xl">
                    <form onSubmit={handlePdfSubmit}>
                        <ModalHeader borderBottomWidth="1px" pb={4} color="green.700">
                            Generate Payslip PDF
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={5}>
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Employee</FormLabel>
                                    <Select 
                                        placeholder="Select an employee" 
                                        value={pdfData.user_id} 
                                        onChange={(e) => setPdfData({ ...pdfData, user_id: e.target.value })}
                                        bg="gray.50"
                                        _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                                    >
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.firstName} {staff.lastName}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Select Month</FormLabel>
                                    <Input 
                                        type="month" 
                                        value={pdfData.month} 
                                        onChange={(e) => setPdfData({ ...pdfData, month: e.target.value })}
                                        bg="gray.50"
                                        _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>Example: February 2026</Text>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTopWidth="1px" pt={4} bg="gray.50" borderBottomRadius="xl">
                            <Button variant="ghost" mr={3} onClick={onPdfClose}>Cancel</Button>
                            <Button colorScheme="green" type="submit" loadingText="Generating..." leftIcon={<FiDownload />}>
                                Download PDF
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default EmployeeSalaries;
