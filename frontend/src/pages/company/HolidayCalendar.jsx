import React, { useState } from 'react';
import {
    Box, Button, Flex, HStack, Text, VStack, Heading, Center, Icon,
    useDisclosure, useToast, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
    FormControl, FormLabel, Input, Select, Switch, Badge, IconButton
} from '@chakra-ui/react';
import { FiCalendar, FiPlus, FiTrash2, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetHolidayCalendarsYearQuery,
    useAddUpdateHolidayMutation,
    useDeleteHolidayMutation
} from '../../store/apiSlice';

const HolidayCalendar = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;
    const currentYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data: calendarData, isLoading, refetch } = useGetHolidayCalendarsYearQuery({ 
        company_id: companyId, 
        year: selectedYear 
    }, { skip: !companyId });

    const holidays = calendarData?.data?.holidays || [];

    const [addUpdateHoliday, { isLoading: isSaving }] = useAddUpdateHolidayMutation();
    const [deleteHoliday] = useDeleteHolidayMutation();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const [formData, setFormData] = useState({ date: '', title: '', type: 'public', is_optional: false });

    const handleOpenModal = () => {
        setFormData({ date: '', title: '', type: 'public', is_optional: false });
        onOpen();
    };

    const handleCloseModal = () => {
        setFormData({ date: '', title: '', type: 'public', is_optional: false });
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addUpdateHoliday({
                company_id: companyId,
                year: selectedYear,
                ...formData
            }).unwrap();
            toast({ title: 'Holiday saved successfully', status: 'success', duration: 3000, isClosable: true });
            handleCloseModal();
            refetch();
        } catch (error) {
            toast({
                title: 'Error saving holiday',
                description: error.data?.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (date) => {
        if (window.confirm('Are you sure you want to delete this holiday?')) {
            try {
                await deleteHoliday({
                    company_id: companyId,
                    year: selectedYear,
                    date
                }).unwrap();
                toast({ title: 'Holiday deleted successfully', status: 'success', duration: 3000, isClosable: true });
                refetch();
            } catch (error) {
                toast({
                    title: 'Delete failed',
                    description: error.data?.message || 'Failed to delete holiday.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'festival': return 'orange';
            case 'public': return 'blue';
            case 'company': return 'purple';
            default: return 'gray';
        }
    };

    return (
        <DashboardLayout>
            <VStack align="stretch" spacing={6}>
                {/* Hero Header */}
                <Box bgGradient="linear(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)" borderRadius="2xl" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
                    <Box position="absolute" top="-40px" right="-40px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.300" />
                    <Box position="absolute" bottom="-20px" left="15%" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.400" />

                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                        <Box>
                            <HStack spacing={3} mb={2}>
                                <Center p={2} bg="whiteAlpha.400" borderRadius="lg" backdropFilter="blur(10px)">
                                    <Icon as={FiCalendar} boxSize={6} color="orange.800" />
                                </Center>
                                <Heading size="lg" color="orange.900" letterSpacing="-0.02em">Holiday Calendar</Heading>
                            </HStack>
                            <Text color="orange.800" fontSize="sm" fontWeight="500">Manage company holidays, festivals, and public off-days for your staff</Text>
                        </Box>

                        <HStack spacing={3}>
                            <Button variant="outline" color="orange.900" _hover={{ bg: 'whiteAlpha.400' }} borderColor="orange.800" onClick={refetch} leftIcon={<Icon as={FiRefreshCw} />} size="sm">
                                Refresh
                            </Button>
                            <Button leftIcon={<FiPlus />} size="sm" onClick={handleOpenModal} colorScheme="orange" bg="orange.500" _hover={{ bg: 'orange.400', transform: 'translateY(-1px)', shadow: 'md' }} transition="all 0.2s">
                                Add Holiday
                            </Button>
                        </HStack>
                    </Flex>
                </Box>

                {/* Year Selector */}
                <Flex justify="space-between" align="center" bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
                    <Text fontWeight="600" color="gray.700">Displaying Year: <Text as="span" color="orange.500">{selectedYear}</Text></Text>
                    <HStack>
                        <IconButton icon={<FiChevronLeft />} variant="outline" onClick={() => setSelectedYear(prev => prev - 1)} aria-label="Previous Year" />
                        <Heading size="md" w="80px" textAlign="center">{selectedYear}</Heading>
                        <IconButton icon={<FiChevronRight />} variant="outline" onClick={() => setSelectedYear(prev => prev + 1)} aria-label="Next Year" />
                    </HStack>
                </Flex>

                {isLoading ? (
                    <LoadingSpinner message="Loading holidays..." />
                ) : holidays.length === 0 ? (
                    <Card border="1px solid" borderColor="gray.100" shadow="sm">
                        <EmptyState
                            title={`No holidays found for ${selectedYear}`}
                            description="You haven't added any holidays for this year yet."
                            icon={FiCalendar}
                            action={
                                <Button leftIcon={<FiPlus />} onClick={handleOpenModal} mt={4} colorScheme="orange">
                                    Add First Holiday
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm">
                        <Box overflowX="auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="bg-orange-50 text-orange-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap w-[60px]">Day</th>
                                        <th className="bg-orange-50 text-orange-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Holiday Name</th>
                                        <th className="bg-orange-50 text-orange-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap">Type</th>
                                        <th className="bg-orange-50 text-orange-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Optional</th>
                                        <th className="bg-orange-50 text-orange-800 text-xs font-bold tracking-wider uppercase py-4 px-6 border-b-none whitespace-nowrap text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {holidays.map((holiday) => {
                                        const dateObj = new Date(holiday.date);
                                        const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
                                        const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                                        return (
                                            <tr key={holiday.id} className="hover:bg-orange-50/50 transition-colors duration-150 odd:bg-white even:bg-gray-50">
                                                <td className="py-4 px-6">
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="700" color="gray.800">{dayStr}</Text>
                                                        <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">{weekdayStr}</Text>
                                                    </VStack>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <HStack spacing={3}>
                                                        <Center p={2} borderRadius="lg" bg={`${getTypeColor(holiday.type)}.100`}>
                                                            <Icon as={FiCalendar} color={`${getTypeColor(holiday.type)}.600`} boxSize={4} />
                                                        </Center>
                                                        <Text fontWeight="600" color="gray.700">{holiday.title}</Text>
                                                    </HStack>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge colorScheme={getTypeColor(holiday.type)} borderRadius="md" px={2} textTransform="capitalize">
                                                        {holiday.type}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Badge colorScheme={holiday.is_optional ? 'green' : 'gray'} borderRadius="full" px={2}>
                                                        {holiday.is_optional ? 'Yes' : 'No'}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <HStack spacing={2} justify="center">
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            aria-label="Delete Holiday"
                                                            onClick={() => handleDelete(holiday.date)}
                                                        />
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

            {/* Create Modal */}
            <Modal isOpen={isOpen} onClose={handleCloseModal}>
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
                <ModalContent borderRadius="xl" boxShadow="xl">
                    <form onSubmit={handleSubmit}>
                        <ModalHeader borderBottomWidth="1px" pb={4}>
                            Add Holiday for {selectedYear}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'orange.500', boxShadow: 'none', bg: 'white' }}
                                    />
                                </FormControl>
                                
                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Holiday Title</FormLabel>
                                    <Input
                                        placeholder="e.g. New Year's Day"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'orange.500', boxShadow: 'none', bg: 'white' }}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontWeight="600" color="gray.700">Type</FormLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        bg="gray.50"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{ borderColor: 'orange.500', boxShadow: 'none', bg: 'white' }}
                                    >
                                        <option value="public">Public</option>
                                        <option value="festival">Festival</option>
                                        <option value="company">Company specific</option>
                                    </Select>
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel htmlFor="is_optional" mb="0" fontWeight="600" color="gray.700">
                                        Is Optional?
                                    </FormLabel>
                                    <Switch
                                        id="is_optional"
                                        colorScheme="orange"
                                        isChecked={formData.is_optional}
                                        onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter borderTopWidth="1px" pt={4} bg="gray.50" borderBottomRadius="xl">
                            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button colorScheme="orange" type="submit" isLoading={isSaving} loadingText="Saving...">
                                Create Holiday
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </DashboardLayout>
    );
};

export default HolidayCalendar;
