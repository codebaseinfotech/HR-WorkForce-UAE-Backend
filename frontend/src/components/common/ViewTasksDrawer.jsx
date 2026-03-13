/**
 * ViewTasksDrawer — company-wide tasks list (right-side drawer)
 * Clicking any task opens TaskDetailModal
 * Props: isOpen, onClose, companyId
 */
import { useState } from 'react';
import {
    Box, VStack, HStack, Icon, Text, Badge, Spinner,
    Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import { FiCalendar, FiClipboard, FiList } from 'react-icons/fi';
import { useGetAdminTasksQuery } from '../../store/apiSlice';
import TaskDetailModal from './TaskDetailModal';

const PRIORITY = {
    low:    { color: 'green',  label: 'Low' },
    medium: { color: 'yellow', label: 'Medium' },
    high:   { color: 'orange', label: 'High' },
    urgent: { color: 'red',    label: 'Urgent' },
};

const ViewTasksDrawer = ({ isOpen, onClose, companyId }) => {

    const [detailTask, setDetailTask] = useState(null);
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

    const { data, isLoading } = useGetAdminTasksQuery(
        { company_id: companyId },
        { skip: !companyId || !isOpen }
    );
    console.log({ data })

    const raw   = data?.data?.data || data?.data || data?.tasks || data || [];
    const tasks = Array.isArray(raw) ? raw : [];

    const openDetail = (t) => { setDetailTask(t); onDetailOpen(); };
    const handleClose = () => { setDetailTask(null); onClose(); };

    return (
        <>
            <Drawer isOpen={isOpen} onClose={handleClose} size="md" placement="right">
                <DrawerOverlay backdropFilter="blur(4px)" />
                <DrawerContent borderLeftRadius="2xl" overflow="hidden">
                    <Box bgGradient="linear(135deg, #764ba2, #667eea)" px={5} py={4}>
                        <DrawerHeader p={0} color="white" fontSize="lg" fontWeight="800">
                            <HStack spacing={2}>
                                <Icon as={FiList} />
                                <Text>Company Tasks</Text>
                            </HStack>
                        </DrawerHeader>
                        <Text fontSize="xs" color="whiteAlpha.800" mt={1}>
                            {isLoading ? 'Loading…' : `${tasks.length} task(s) — click to view & act`}
                        </Text>
                    </Box>
                    <DrawerCloseButton color="white" top={4} right={4} />

                    <DrawerBody pt={4}>
                        {isLoading ? (
                            <VStack py={8}>
                                <Spinner color="purple.400" size="lg" />
                            </VStack>
                        ) : tasks.length === 0 ? (
                            <VStack py={8} spacing={3}>
                                <Icon as={FiClipboard} boxSize={10} color="gray.300" />
                                <Text color="gray.400" fontSize="sm">No tasks yet</Text>
                            </VStack>
                        ) : (
                            <VStack spacing={3} align="stretch">
                                {tasks.map(t => {
                                    const p = PRIORITY[t.priority] || PRIORITY.medium;
                                    return (
                                        <Box key={t.id} border="1px solid" borderColor="gray.200"
                                            borderRadius="xl" p={4} cursor="pointer" bg="white"
                                            transition="all 0.2s"
                                            _hover={{ shadow: 'md', borderColor: 'purple.300', transform: 'translateY(-1px)' }}
                                            onClick={() => openDetail(t)}>
                                            <HStack justify="space-between" mb={1}>
                                                <Badge colorScheme="gray" borderRadius="full" fontSize="2xs">
                                                    #{t.id}
                                                </Badge>
                                                <Badge colorScheme={p.color} borderRadius="full" fontSize="2xs">
                                                    {p.label}
                                                </Badge>
                                            </HStack>
                                            <Text fontWeight="700" fontSize="sm" mb={1}>{t.title}</Text>
                                            {t.description && (
                                                <Text fontSize="xs" color="gray.400" noOfLines={2} mb={1}>
                                                    {t.description}
                                                </Text>
                                            )}
                                            {t.due_date && (
                                                <HStack spacing={1}>
                                                    <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                                                    <Text fontSize="xs" color="gray.400">
                                                        {new Date(t.due_date).toLocaleDateString()}
                                                    </Text>
                                                </HStack>
                                            )}
                                            <Text fontSize="2xs" color="purple.500" fontWeight="600" mt={2}>
                                                Click to view & act →
                                            </Text>
                                        </Box>
                                    );
                                })}
                            </VStack>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* Nested Task Detail Modal */}
            <TaskDetailModal isOpen={isDetailOpen} onClose={onDetailClose} task={detailTask} companyId={companyId} />
        </>
    );
};

export default ViewTasksDrawer;
