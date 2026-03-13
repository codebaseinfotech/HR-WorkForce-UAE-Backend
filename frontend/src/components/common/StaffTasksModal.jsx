/**
 * StaffTasksModal — lists all tasks for a specific staff user
 * via GET /api/v1/my-tasks?company_id=&user_id=
 * Props: isOpen, onClose, staffMember, companyId
 */
import { useState } from 'react';
import {
    Box, VStack, HStack, Heading, Button, Icon, Text, Badge, Avatar,
    Divider, Spinner, Modal, ModalOverlay, ModalContent, ModalBody,
    ModalFooter, ModalCloseButton, useDisclosure,
} from '@chakra-ui/react';
import { FiCalendar, FiClipboard, FiEye } from 'react-icons/fi';
import { useGetMyTasksQuery } from '../../store/apiSlice';
import TaskDetailModal from './TaskDetailModal';

const PRIORITY = {
    low:    { color: 'green',  label: 'Low' },
    medium: { color: 'yellow', label: 'Medium' },
    high:   { color: 'orange', label: 'High' },
    urgent: { color: 'red',    label: 'Urgent' },
};

const STATUS_COLOR = {
    draft:       'gray',
    active:      'blue',
    in_progress: 'orange',
    completed:   'green',
    blocked:     'red',
    assigned:    'purple',
};

const StaffTasksModal = ({ isOpen, onClose, staffMember, companyId }) => {

    const [detailTask, setDetailTask] = useState(null);
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

    const staffName = staffMember
        ? `${staffMember.first_name || staffMember.firstName || ''} ${staffMember.last_name || staffMember.lastName || ''}`.trim()
        : '';

    // Paginated: { status, data: { current_page, data: [...tasks] } }
    const { data, isLoading } = useGetMyTasksQuery(
        { company_id: companyId, user_id: staffMember?.id },
        { skip: !staffMember?.id || !isOpen }
    );

    const raw   = data?.data?.data || data?.data || data?.tasks || data || [];
    const tasks = Array.isArray(raw) ? raw : [];

    const openDetail = (t) => { setDetailTask(t); onDetailOpen(); };

    const handleClose = () => { setDetailTask(null); onClose(); };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} size="2xl" isCentered scrollBehavior="inside">
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
                <ModalContent borderRadius="2xl" overflow="hidden" maxW="680px" mx={4}>

                    {/* Blue gradient header */}
                    <Box bgGradient="linear(135deg, #2980b9, #6dd5fa, #2980b9)" px={6} py={5}>
                        <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} borderRadius="lg" />
                        <HStack spacing={3}>
                            <Avatar size="md" name={staffName} src={staffMember?.p_image_url}
                                border="3px solid white" />
                            <VStack align="start" spacing={0}>
                                <Text fontSize="2xs" color="whiteAlpha.700" fontWeight="700"
                                    letterSpacing="wider" textTransform="uppercase">
                                    Tasks for
                                </Text>
                                <Heading size="md" color="white">{staffName}</Heading>
                                <Badge borderRadius="full" fontSize="xs" bg="whiteAlpha.200" color="white">
                                    User ID: {staffMember?.id}
                                </Badge>
                            </VStack>
                        </HStack>
                        <Box mt={3} h="3px" borderRadius="full"
                            bgGradient="linear(to-r, white, whiteAlpha.300)" />
                    </Box>

                    {/* Stat pills */}
                    {!isLoading && tasks.length > 0 && (
                        <Box px={6} py={3} bg="blue.50" borderBottom="1px solid" borderColor="blue.100">
                            <HStack spacing={2} flexWrap="wrap">
                                <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs">
                                    {tasks.length} Total
                                </Badge>
                                {Object.keys(STATUS_COLOR).map(s => {
                                    const cnt = tasks.filter(t => t.status === s).length;
                                    if (!cnt) return null;
                                    return (
                                        <Badge key={s} colorScheme={STATUS_COLOR[s]} borderRadius="full"
                                            px={3} py={1} fontSize="xs" textTransform="capitalize">
                                            {s}: {cnt}
                                        </Badge>
                                    );
                                })}
                            </HStack>
                        </Box>
                    )}

                    <ModalBody p={5} overflowY="auto" maxH="60vh">
                        {isLoading ? (
                            <VStack py={10}>
                                <Spinner color="blue.400" size="xl" />
                                <Text color="gray.400" fontSize="sm">Loading tasks…</Text>
                            </VStack>
                        ) : tasks.length === 0 ? (
                            <VStack py={10} spacing={3}>
                                <Icon as={FiClipboard} boxSize={12} color="gray.200" />
                                <Text color="gray.400" fontSize="sm">No tasks found for this staff member</Text>
                            </VStack>
                        ) : (
                            <VStack spacing={3} align="stretch">
                                <Text fontSize="xs" color="gray.400" fontWeight="600">
                                    Click a card to view details, add action or feedback
                                </Text>
                                {tasks.map(t => {
                                    const p = PRIORITY[t.priority] || PRIORITY.medium;
                                    return (
                                        <Box key={t.id} border="1px solid" borderColor="gray.200"
                                            borderRadius="xl" p={4} cursor="pointer" bg="white"
                                            transition="all 0.2s"
                                            _hover={{ shadow: 'md', borderColor: 'blue.300', transform: 'translateY(-1px)' }}
                                            onClick={() => openDetail(t)}>
                                            <HStack justify="space-between" mb={2}>
                                                <HStack spacing={2} flexWrap="wrap">
                                                    <Badge colorScheme="gray" borderRadius="full" fontSize="2xs">
                                                        #{t.id}
                                                    </Badge>
                                                    <Badge colorScheme={p.color} borderRadius="full" fontSize="2xs">
                                                        {p.label}
                                                    </Badge>
                                                    {t.status && (
                                                        <Badge colorScheme={STATUS_COLOR[t.status] || 'blue'}
                                                            borderRadius="full" fontSize="2xs" textTransform="capitalize">
                                                            {t.status}
                                                        </Badge>
                                                    )}
                                                </HStack>
                                                <Icon as={FiEye} boxSize={4} color="gray.300" />
                                            </HStack>
                                            <Text fontWeight="700" fontSize="sm" color="gray.800" mb={1}>
                                                {t.title}
                                            </Text>
                                            {t.description && (
                                                <Text fontSize="xs" color="gray.500" noOfLines={2} mb={2}>
                                                    {t.description}
                                                </Text>
                                            )}
                                            <HStack justify="space-between" mt={1}>
                                                {t.due_date ? (
                                                    <HStack spacing={1}>
                                                        <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                                                        <Text fontSize="xs" color="gray.400">
                                                            Due: {new Date(t.due_date).toLocaleDateString()}
                                                        </Text>
                                                    </HStack>
                                                ) : <Box />}
                                                <Text fontSize="2xs" color="blue.500" fontWeight="700">
                                                    View & Act →
                                                </Text>
                                            </HStack>
                                        </Box>
                                    );
                                })}
                            </VStack>
                        )}
                    </ModalBody>

                    <Divider />
                    <ModalFooter>
                        <Button variant="outline" borderRadius="xl" onClick={handleClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Nested Task Detail Modal */}
            <TaskDetailModal isOpen={isDetailOpen} onClose={onDetailClose} task={detailTask} companyId={companyId} />
        </>
    );
};

export default StaffTasksModal;
