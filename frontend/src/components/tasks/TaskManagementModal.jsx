import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    HStack,
    Grid,
    Icon,
    Badge,
    Text,
    VStack,
    Button,
    useToast,
    Divider,
    Textarea,
    Input,
    FormControl,
    FormLabel,
    IconButton,
    Spinner,
    Center,
    Avatar,
    Flex,
    Stack,
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react';
import {
    FiFileText,
    FiMessageSquare,
    FiPaperclip,
    FiMessageCircle,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiTrash2,
    FiSend,
    FiDownload,
    FiCalendar,
    FiUser,
    FiCircle,
    FiChevronDown,
} from 'react-icons/fi';
import {
    useGetTasksQuery,
    useGetTaskCommentsQuery,
    useAddTaskCommentMutation,
    useDeleteTaskCommentMutation,
    useGetTaskDocumentsQuery,
    useUploadTaskDocumentMutation,
    useDeleteTaskDocumentMutation,
    useGetTaskChatQuery,
    useSendTaskChatMessageMutation,
    useUpdateTaskStatusMutation,
    useDeleteTaskMutation,
    useUpdateTaskMutation,
} from '../../store/apiSlice';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Card from '../common/Card';

const TaskManagementModal = ({ isOpen, onClose, staffMember }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [selectedTask, setSelectedTask] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');

    // Queries
    const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery(
        { staffId: staffMember?.id },
        { skip: !staffMember?.id }
    );

    const { data: commentsData, isLoading: commentsLoading } = useGetTaskCommentsQuery(
        selectedTask?.id,
        { skip: !selectedTask?.id }
    );

    const { data: documentsData, isLoading: documentsLoading } = useGetTaskDocumentsQuery(
        selectedTask?.id,
        { skip: !selectedTask?.id }
    );

    const { data: chatData, isLoading: chatLoading } = useGetTaskChatQuery(
        selectedTask?.id,
        { skip: !selectedTask?.id }
    );

    // Mutations
    const [updateTaskStatus] = useUpdateTaskStatusMutation();
    const [deleteTask] = useDeleteTaskMutation();
    const [updateTask] = useUpdateTaskMutation();
    const [addComment] = useAddTaskCommentMutation();
    const [deleteComment] = useDeleteTaskCommentMutation();
    const [uploadDocument] = useUploadTaskDocumentMutation();
    const [deleteDocument] = useDeleteTaskDocumentMutation();
    const [sendChatMessage] = useSendTaskChatMessageMutation();

    // Custom close handler to reset state
    const handleModalClose = () => {
        setSelectedTask(null);
        setIsEditingDescription(false);
        setEditedDescription('');
        setCommentText('');
        setChatMessage('');
        onClose();
    };

    const tasks = tasksData?.tasks || [];
    const comments = commentsData?.comments || [];
    const documents = documentsData?.documents || [];
    const chatMessages = chatData?.messages || [];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return FiCheckCircle;
            case 'in-progress':
                return FiClock;
            default:
                return FiAlertCircle;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in-progress':
                return 'warning';
            case 'in-review':
                return 'info';
            default:
                return 'gray';
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await updateTaskStatus({ id: taskId, status: newStatus }).unwrap();
            // Update selectedTask to reflect new status in UI
            setSelectedTask(prev => ({ ...prev, status: newStatus }));
            toast({
                title: 'Status Updated',
                status: 'success',
                duration: 2000,
                position: 'top-right',
            });
        } catch (error) {
            toast({
                title: 'Failed to update status',
                description: error.data?.message,
                status: 'error',
                duration: 3000,
                position: ' top-right',
            });
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(taskId).unwrap();
                setSelectedTask(null);
                toast({
                    title: 'Task deleted',
                    status: 'success',
                    duration: 2000,
                    position: 'top-right',
                });
            } catch (error) {
                toast({
                    title: 'Failed to delete task',
                    description: error.data?.message,
                    status: 'error',
                    duration: 3000,
                    position: 'top-right',
                });
            }
        }
    };

    const handleEditDescription = () => {
        setEditedDescription(selectedTask.description || '');
        setIsEditingDescription(true);
    };

    const handleSaveDescription = async () => {
        try {
            await updateTask({
                id: selectedTask.id,
                description: editedDescription,
            }).unwrap();
            setSelectedTask(prev => ({ ...prev, description: editedDescription }));
            setIsEditingDescription(false);
            toast({
                title: 'Description Updated',
                status: 'success',
                duration: 2000,
                position: 'top-right',
            });
        } catch (error) {
            toast({
                title: 'Failed to update description',
                description: error.data?.message,
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setEditedDescription('');
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;

        try {
            await addComment({
                taskId: selectedTask.id,
                userId: user.id,
                message: commentText,
            }).unwrap();
            setCommentText('');
        } catch (error) {
            toast({
                title: 'Failed to add comment',
                description: error.data?.message,
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteComment({ taskId: selectedTask.id, commentId }).unwrap();
        } catch (error) {
            console.log(error);
            toast({
                title: 'Failed to delete comment',
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    const handleFileChange = (e) => {
        setFileToUpload(e.target.files[0]);
    };

    const handleUploadDocument = async () => {
        if (!fileToUpload) return;

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('userId', user.id);

        try {
            await uploadDocument({ taskId: selectedTask.id, formData }).unwrap();
            setFileToUpload(null);
            document.getElementById('file-upload').value = '';
            toast({
                title: 'Document uploaded',
                status: 'success',
                duration: 2000,
                position: 'top-right',
            });
        } catch (error) {
            toast({
                title: 'Failed to upload document',
                description: error.data?.message,
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    const handleDeleteDocument = async (docId) => {
        try {
            await deleteDocument({ taskId: selectedTask.id, docId }).unwrap();
            toast({
                title: 'Document deleted',
                status: 'success',
                duration: 2000,
                position: 'top-right',
            });
        } catch (error) {
            console.log(error);
            toast({
                title: 'Failed to delete document',
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    const handleSendChat = async () => {
        if (!chatMessage.trim()) return;

        try {
            await sendChatMessage({
                taskId: selectedTask.id,
                userId: user.id,
                message: chatMessage,
            }).unwrap();
            setChatMessage('');
        } catch (error) {
            console.log(error);
            toast({
                title: 'Failed to send message',
                status: 'error',
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleModalClose} size="6xl" isCentered>
            <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
            <ModalContent borderRadius="xl" maxH="85vh" overflow="hidden">
                {/* Header */}
                <ModalHeader
                    bg="primary.600"
                    color="white"
                    py={4}
                    px={6}
                >
                    <HStack spacing={3}>
                        <Icon as={FiFileText} boxSize={5} />
                        <Text fontSize="lg" fontWeight="bold">
                            Task Management - {staffMember?.firstName} {staffMember?.lastName}
                        </Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton color="white" top={4} right={4} />

                <ModalBody p={0}>
                    <Grid templateColumns={{ base: '1fr', lg: '260px 1fr' }} h="calc(85vh - 64px)">
                        {/* Sidebar - Task List */}
                        <Box borderRight="1px" borderColor="gray.200" overflowY="auto" bg="gray.50" p={4}>
                            <VStack align="stretch" spacing={3}>
                                <Text fontWeight="semibold" fontSize="xs" color="gray.500" textTransform="uppercase">
                                    Tasks ({tasks.length})
                                </Text>
                                {tasksLoading ? (
                                    <Center py={10}>
                                        <Spinner color="primary.500" />
                                    </Center>
                                ) : tasks.length === 0 ? (
                                    <Box textAlign="center" py={8}>
                                        <Icon as={FiFileText} boxSize={8} color="gray.300" mb={2} />
                                        <Text fontSize="sm" color="gray.500">No tasks assigned</Text>
                                    </Box>
                                ) : (
                                    tasks.map((task) => (
                                        <Card
                                            key={task.id}
                                            p={3}
                                            cursor="pointer"
                                            bg={selectedTask?.id === task.id ? 'primary.50' : 'white'}
                                            borderColor={selectedTask?.id === task.id ? 'primary.500' : 'gray.200'}
                                            borderWidth={selectedTask?.id === task.id ? '2px' : '1px'}
                                            onClick={() => setSelectedTask(task)}
                                            _hover={{ shadow: 'sm', borderColor: 'primary.300' }}
                                            transition="all 0.2s"
                                        >
                                            <VStack align="stretch" spacing={2}>
                                                <HStack justify="space-between">
                                                    <Icon
                                                        as={getStatusIcon(task.status)}
                                                        color={`${getStatusColor(task.status)}.500`}
                                                        boxSize={4}
                                                    />
                                                    <Badge
                                                        colorScheme={getPriorityColor(task.priority)}
                                                        fontSize="2xs"
                                                    >
                                                        {task.priority}
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>
                                                    {task.title}
                                                </Text>
                                                {task.dueDate && (
                                                    <Text fontSize="xs" color="gray.500">
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </Text>
                                                )}
                                            </VStack>
                                        </Card>
                                    ))
                                )}
                            </VStack>
                        </Box>

                        {/* Main Area - Task Details */}
                        <Box overflowY="auto" p={6}>
                            {!selectedTask ? (
                                <Center h="full">
                                    <VStack spacing={3}>
                                        <Icon as={FiFileText} boxSize={12} color="gray.300" />
                                        <Text fontSize="md" color="gray.500" fontWeight="medium">
                                            Select a task to view details
                                        </Text>
                                    </VStack>
                                </Center>
                            ) : (
                                <VStack align="stretch" spacing={5}>
                                    {/* Task Header */}
                                    <Box>
                                        <HStack justify="space-between" mb={3}>
                                            <Box flex="1">
                                                <Text fontSize="xl" fontWeight="bold" mb={2} color="gray.800">
                                                    {selectedTask.title}
                                                </Text>
                                                <HStack spacing={3} flexWrap="wrap">
                                                    <Badge colorScheme={getPriorityColor(selectedTask.priority)}>
                                                        {selectedTask.priority} priority
                                                    </Badge>
                                                    {selectedTask.dueDate && (
                                                        <HStack spacing={1} fontSize="sm" color="gray.600">
                                                            <Icon as={FiCalendar} boxSize={4} />
                                                            <Text>
                                                                {new Date(selectedTask.dueDate).toLocaleDateString()}
                                                            </Text>
                                                        </HStack>
                                                    )}
                                                    <HStack spacing={1} fontSize="sm" color="gray.600">
                                                        <Icon as={FiUser} boxSize={4} />
                                                        <Text>By: {selectedTask.assignedByName}</Text>
                                                    </HStack>
                                                </HStack>
                                            </Box>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorScheme="error"
                                                leftIcon={<Icon as={FiTrash2} />}
                                                onClick={() => handleDeleteTask(selectedTask.id)}
                                            >
                                                Delete
                                            </Button>
                                        </HStack>

                                        {/* Status Dropdown */}
                                        <Box>
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
                                                Status
                                            </Text>
                                            <Menu>
                                                <MenuButton
                                                    as={Button}
                                                    rightIcon={<Icon as={FiChevronDown} />}
                                                    size="md"
                                                    colorScheme={getStatusColor(selectedTask.status)}
                                                    variant="solid"
                                                    w={{ base: 'full', md: 'auto' }}
                                                    minW="200px"
                                                >
                                                    <HStack spacing={2}>
                                                        <Icon as={getStatusIcon(selectedTask.status)} />
                                                        <Text textTransform="uppercase" fontSize="sm" fontWeight="bold">
                                                            {selectedTask.status === 'todo'
                                                                ? 'To Do'
                                                                : selectedTask.status === 'in-progress'
                                                                    ? 'In Progress'
                                                                    : selectedTask.status === 'in-review'
                                                                        ? 'In Review'
                                                                        : 'Completed'}
                                                        </Text>
                                                    </HStack>
                                                </MenuButton>
                                                <MenuList minW="200px">
                                                    <MenuItem
                                                        onClick={() => handleStatusChange(selectedTask.id, 'todo')}
                                                        bg={selectedTask.status === 'todo' ? 'gray.50' : 'transparent'}
                                                    >
                                                        <HStack spacing={3} w="full">
                                                            <Icon as={FiCircle} color="gray.500" />
                                                            <Badge colorScheme="gray" textTransform="uppercase" fontSize="xs">
                                                                To Do
                                                            </Badge>
                                                        </HStack>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => handleStatusChange(selectedTask.id, 'in-progress')}
                                                        bg={selectedTask.status === 'in-progress' ? 'orange.50' : 'transparent'}
                                                    >
                                                        <HStack spacing={3} w="full">
                                                            <Icon as={FiClock} color="orange.500" />
                                                            <Badge colorScheme="warning" textTransform="uppercase" fontSize="xs">
                                                                In Progress
                                                            </Badge>
                                                        </HStack>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => handleStatusChange(selectedTask.id, 'in-review')}
                                                        bg={selectedTask.status === 'in-review' ? 'blue.50' : 'transparent'}
                                                    >
                                                        <HStack spacing={3} w="full">
                                                            <Icon as={FiAlertCircle} color="blue.500" />
                                                            <Badge colorScheme="info" textTransform="uppercase" fontSize="xs">
                                                                In Review
                                                            </Badge>
                                                        </HStack>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => handleStatusChange(selectedTask.id, 'completed')}
                                                        bg={selectedTask.status === 'completed' ? 'green.50' : 'transparent'}
                                                    >
                                                        <HStack spacing={3} w="full">
                                                            <Icon as={FiCheckCircle} color="green.500" />
                                                            <Badge colorScheme="success" textTransform="uppercase" fontSize="xs">
                                                                Completed
                                                            </Badge>
                                                        </HStack>
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    {/* Tabs */}
                                    <Tabs colorScheme="primary" size="sm">
                                        <TabList>
                                            <Tab>
                                                <Icon as={FiFileText} mr={2} />
                                                Details
                                            </Tab>
                                            <Tab>
                                                <Icon as={FiMessageSquare} mr={2} />
                                                Comments ({comments.length})
                                            </Tab>
                                            <Tab>
                                                <Icon as={FiPaperclip} mr={2} />
                                                Documents ({documents.length})
                                            </Tab>
                                            <Tab>
                                                <Icon as={FiMessageCircle} mr={2} />
                                                Chat ({chatMessages.length})
                                            </Tab>
                                        </TabList>

                                        <TabPanels>
                                            {/* Details Tab */}
                                            <TabPanel px={0} pt={4}>
                                                <VStack align="stretch" spacing={3}>
                                                    <Box>
                                                        <HStack justify="space-between" mb={2}>
                                                            <Text fontWeight="semibold" color="gray.700">
                                                                Description
                                                            </Text>
                                                            {!isEditingDescription && (
                                                                <Button
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    colorScheme="primary"
                                                                    onClick={handleEditDescription}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
                                                        </HStack>
                                                        {isEditingDescription ? (
                                                            <VStack align="stretch" spacing={2}>
                                                                <Textarea
                                                                    value={editedDescription}
                                                                    onChange={(e) => setEditedDescription(e.target.value)}
                                                                    placeholder="Enter task description..."
                                                                    rows={4}
                                                                    resize="vertical"
                                                                />
                                                                <HStack spacing={2} justify="flex-end">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        colorScheme="primary"
                                                                        onClick={handleSaveDescription}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                </HStack>
                                                            </VStack>
                                                        ) : (
                                                            <Text
                                                                color="gray.600"
                                                                p={3}
                                                                bg="gray.50"
                                                                borderRadius="md"
                                                                cursor="pointer"
                                                                onClick={handleEditDescription}
                                                                _hover={{ bg: 'gray.100' }}
                                                                transition="background 0.2s"
                                                            >
                                                                {selectedTask.description || 'No description provided. Click to add one.'}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                </VStack>
                                            </TabPanel>

                                            {/* Comments Tab */}
                                            <TabPanel px={0} pt={4}>
                                                <VStack align="stretch" spacing={4} maxH="400px" overflowY="auto">
                                                    {commentsLoading ? (
                                                        <Center py={8}>
                                                            <Spinner color="primary.500" />
                                                        </Center>
                                                    ) : comments.length === 0 ? (
                                                        <Box textAlign="center" py={8}>
                                                            <Icon as={FiMessageSquare} boxSize={8} color="gray.300" mb={2} />
                                                            <Text fontSize="sm" color="gray.500">No comments yet</Text>
                                                        </Box>
                                                    ) : (
                                                        comments.map((comment) => (
                                                            <Card key={comment.id} p={3}>
                                                                <HStack align="start" justify="space-between">
                                                                    <HStack align="start" spacing={3} flex="1">
                                                                        <Avatar size="sm" name={comment.userName} bg="primary.500" />
                                                                        <Box flex="1">
                                                                            <HStack spacing={2} mb={1}>
                                                                                <Text fontWeight="semibold" fontSize="sm">
                                                                                    {comment.userName}
                                                                                </Text>
                                                                                <Badge size="xs" colorScheme="gray">
                                                                                    {comment.userRole}
                                                                                </Badge>
                                                                            </HStack>
                                                                            <Text fontSize="sm" color="gray.700">
                                                                                {comment.message}
                                                                            </Text>
                                                                            <Text fontSize="xs" color="gray.500" mt={1}>
                                                                                {new Date(comment.createdAt).toLocaleString()}
                                                                            </Text>
                                                                        </Box>
                                                                    </HStack>
                                                                    {comment.userId === user.id && (
                                                                        <IconButton
                                                                            icon={<Icon as={FiTrash2} />}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            colorScheme="error"
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                        />
                                                                    )}
                                                                </HStack>
                                                            </Card>
                                                        ))
                                                    )}

                                                    <HStack spacing={2}>
                                                        <Textarea
                                                            placeholder="Add a comment..."
                                                            value={commentText}
                                                            onChange={(e) => setCommentText(e.target.value)}
                                                            rows={2}
                                                            size="sm"
                                                        />
                                                        <Button
                                                            colorScheme="primary"
                                                            onClick={handleAddComment}
                                                            isDisabled={!commentText.trim()}
                                                            size="sm"
                                                        >
                                                            Post
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </TabPanel>

                                            {/* Documents Tab */}
                                            <TabPanel px={0} pt={4}>
                                                <VStack align="stretch" spacing={4}>
                                                    {/* Upload Section */}
                                                    <Card p={4} bg="gray.50">
                                                        <VStack spacing={3}>
                                                            <FormControl>
                                                                <FormLabel fontSize="sm">Upload Document</FormLabel>
                                                                <Input
                                                                    id="file-upload"
                                                                    type="file"
                                                                    onChange={handleFileChange}
                                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip"
                                                                    size="sm"
                                                                />
                                                            </FormControl>
                                                            {fileToUpload && (
                                                                <Button
                                                                    size="sm"
                                                                    colorScheme="primary"
                                                                    onClick={handleUploadDocument}
                                                                    w="full"
                                                                >
                                                                    Upload {fileToUpload.name}
                                                                </Button>
                                                            )}
                                                        </VStack>
                                                    </Card>

                                                    {documentsLoading ? (
                                                        <Center py={8}>
                                                            <Spinner color="primary.500" />
                                                        </Center>
                                                    ) : documents.length === 0 ? (
                                                        <Box textAlign="center" py={8}>
                                                            <Icon as={FiPaperclip} boxSize={8} color="gray.300" mb={2} />
                                                            <Text fontSize="sm" color="gray.500">No documents uploaded</Text>
                                                        </Box>
                                                    ) : (
                                                        documents.map((doc) => (
                                                            <Card key={doc.id} p={3}>
                                                                <HStack justify="space-between">
                                                                    <HStack spacing={3}>
                                                                        <Icon as={FiPaperclip} color="primary.500" boxSize={5} />
                                                                        <Box>
                                                                            <Text fontWeight="semibold" fontSize="sm">
                                                                                {doc.fileName}
                                                                            </Text>
                                                                            <Text fontSize="xs" color="gray.500">
                                                                                Uploaded by {doc.uploadedByName} •{' '}
                                                                                {new Date(doc.createdAt).toLocaleDateString()}
                                                                            </Text>
                                                                        </Box>
                                                                    </HStack>
                                                                    <HStack>
                                                                        <IconButton
                                                                            icon={<Icon as={FiDownload} />}
                                                                            size="sm"
                                                                            as="a"
                                                                            href={`http://localhost:5000${doc.fileUrl}`}
                                                                            target="_blank"
                                                                            download
                                                                        />
                                                                        {doc.uploadedBy === user.id && (
                                                                            <IconButton
                                                                                icon={<Icon as={FiTrash2} />}
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                colorScheme="error"
                                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                            />
                                                                        )}
                                                                    </HStack>
                                                                </HStack>
                                                            </Card>
                                                        ))
                                                    )}
                                                </VStack>
                                            </TabPanel>

                                            {/* Chat Tab */}
                                            <TabPanel px={0} pt={4}>
                                                <VStack align="stretch" spacing={4} h="350px">
                                                    {/* Chat Messages */}
                                                    <Box flex="1" overflowY="auto" p={2}>
                                                        {chatLoading ? (
                                                            <Center py={8}>
                                                                <Spinner color="primary.500" />
                                                            </Center>
                                                        ) : chatMessages.length === 0 ? (
                                                            <Box textAlign="center" py={8}>
                                                                <Icon as={FiMessageCircle} boxSize={8} color="gray.300" mb={2} />
                                                                <Text fontSize="sm" color="gray.500">No messages yet</Text>
                                                            </Box>
                                                        ) : (
                                                            <VStack align="stretch" spacing={3}>
                                                                {chatMessages.map((msg) => (
                                                                    <HStack
                                                                        key={msg.id}
                                                                        justify={msg.userId === user.id ? 'flex-end' : 'flex-start'}
                                                                    >
                                                                        {msg.userId !== user.id && (
                                                                            <Avatar size="sm" name={msg.userName} bg="primary.500" />
                                                                        )}
                                                                        <Card
                                                                            p={3}
                                                                            maxW="70%"
                                                                            bg={
                                                                                msg.userId === user.id
                                                                                    ? 'primary.500'
                                                                                    : 'gray.100'
                                                                            }
                                                                            color={msg.userId === user.id ? 'white' : 'gray.800'}
                                                                        >
                                                                            {msg.userId !== user.id && (
                                                                                <Text fontSize="xs" fontWeight="semibold" mb={1}>
                                                                                    {msg.userName}
                                                                                </Text>
                                                                            )}
                                                                            <Text fontSize="sm">{msg.message}</Text>
                                                                            <Text
                                                                                fontSize="xs"
                                                                                mt={1}
                                                                                opacity={0.8}
                                                                            >
                                                                                {new Date(msg.createdAt).toLocaleTimeString()}
                                                                            </Text>
                                                                        </Card>
                                                                        {msg.userId === user.id && (
                                                                            <Avatar size="sm" name={msg.userName} bg="primary.500" />
                                                                        )}
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        )}
                                                    </Box>

                                                    {/* Chat Input */}
                                                    <HStack>
                                                        <Input
                                                            placeholder="Type a message..."
                                                            value={chatMessage}
                                                            onChange={(e) => setChatMessage(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSendChat();
                                                                }
                                                            }}
                                                            size="sm"
                                                        />
                                                        <IconButton
                                                            icon={<Icon as={FiSend} />}
                                                            colorScheme="primary"
                                                            onClick={handleSendChat}
                                                            isDisabled={!chatMessage.trim()}
                                                            size="sm"
                                                        />
                                                    </HStack>
                                                </VStack>
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </VStack>
                            )}
                        </Box>
                    </Grid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

TaskManagementModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    staffMember: PropTypes.shape({
        id: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
    }),
};

export default TaskManagementModal;
