import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Flex, Text, VStack, HStack, Avatar, Input, IconButton, Button,
    useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, FormControl, FormLabel, Select, CheckboxGroup, Checkbox, 
    Divider, Spinner
} from '@chakra-ui/react';
import { FiSend, FiMessageSquare, FiPlus, FiUsers, FiUser } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
    // useGetUserThreadsQuery,
    // useGetThreadMessagesQuery,
    useSendMessageMutation,
    useCreateDirectThreadMutation,
    useCreateGroupThreadMutation,
    useGetStaffQuery
} from '../../store/apiSlice';

const Chat = () => {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.id;

    // Queries
    // const { data: threadsData, isLoading: isLoadingThreads, refetch: refetchThreads } = useGetUserThreadsQuery({ per_page: 50 });
    const threads = [];
    const isLoadingThreads = false;
    const refetchThreads = () => { };

    const { data: staffData } = useGetStaffQuery(companyId, { skip: !companyId });
    const staffList = staffData?.data || [];

    // State
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [messageText, setMessageText] = useState('');

    // const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useGetThreadMessagesQuery(activeThreadId, { skip: !activeThreadId });
    const messages = [];
    const isLoadingMessages = false;
    const refetchMessages = () => { };
    // Mutations
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
    const [createDirect] = useCreateDirectThreadMutation();
    const [createGroup] = useCreateGroupThreadMutation();

    // Modals
    const { isOpen: isDirectOpen, onOpen: onDirectOpen, onClose: onDirectClose } = useDisclosure();
    const { isOpen: isGroupOpen, onOpen: onGroupOpen, onClose: onGroupClose } = useDisclosure();

    const [directUserId, setDirectUserId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        // Simple polling for new messages every 10 seconds if a thread is active
        let interval;
        if (activeThreadId) {
            interval = setInterval(() => {
                refetchMessages();
                refetchThreads();
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [activeThreadId, refetchMessages, refetchThreads]);


    const getThreadName = (thread) => {
        if (thread.type === 'group') return thread.name;
        // For direct, find the other user
        const otherMember = thread.members.find(m => m.user.id !== user.id);
        return otherMember ? `${otherMember.user.first_name} ${otherMember.user.last_name}` : 'Unknown User';
    };

    const getThreadAvatar = (thread) => {
        if (thread.type === 'group') return null; // Can return group icon
        const otherMember = thread.members.find(m => m.user.id !== user.id);
        return otherMember ? otherMember.user.avatar_path : null;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeThreadId) return;

        try {
            await sendMessage({ id: activeThreadId, body: messageText }).unwrap();
            setMessageText('');
            refetchMessages();
            refetchThreads();
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleCreateDirect = async () => {
        if (!directUserId) return;
        try {
            const res = await createDirect({ user_id: directUserId }).unwrap();
            onDirectClose();
            refetchThreads();
            setActiveThreadId(res.data.id);
            setDirectUserId('');
        } catch (error) {
            console.error('Failed to create direct chat', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || groupMembers.length === 0) return;
        try {
            const res = await createGroup({ name: groupName, member_ids: groupMembers }).unwrap();
            onGroupClose();
            refetchThreads();
            setActiveThreadId(res.data.id);
            setGroupName('');
            setGroupMembers([]);
        } catch (error) {
            console.error('Failed to create group chat', error);
        }
    };

    return (
        <DashboardLayout>
            <Flex h="calc(100vh - 120px)" bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200" overflow="hidden">
                {/* Sidebar (Thread List) */}
                <Box w={{ base: 'full', md: '350px' }} display={{ base: activeThreadId ? 'none' : 'block', md: 'block' }} borderRight="1px solid" borderColor="gray.200" bg="gray.50" flexDirection="column">
                    <Box p={5} borderBottom="1px solid" borderColor="gray.200" bg="white">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Text fontSize="lg" fontWeight="700" color="gray.800">Messages</Text>
                            <HStack>
                                <IconButton icon={<FiUser />} size="sm" variant="ghost" colorScheme="blue" onClick={onDirectOpen} aria-label="New Direct Chat" title="New Direct Chat" />
                                <IconButton icon={<FiUsers />} size="sm" variant="ghost" colorScheme="teal" onClick={onGroupOpen} aria-label="New Group Chat" title="New Group Chat" />
                            </HStack>
                        </Flex>
                        <Input placeholder="Search messages..." bg="gray.100" border="none" _focus={{ bg: 'white', shadow: 'sm' }} size="sm" borderRadius="md" />
                    </Box>

                    <Box flex="1" overflowY="auto">
                        {isLoadingThreads ? (
                            <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
                        ) : threads.length === 0 ? (
                            <VStack p={10} color="gray.400" spacing={3}>
                                <FiMessageSquare size={32} />
                                <Text fontSize="sm">No conversations yet</Text>
                            </VStack>
                        ) : (
                            <VStack spacing={0} align="stretch" divider={<Divider m="0" />}>
                                {threads.map(thread => (
                                    <Flex 
                                        key={thread.id} 
                                        p={4} 
                                        cursor="pointer" 
                                        bg={activeThreadId === thread.id ? 'blue.50' : 'transparent'}
                                        _hover={{ bg: activeThreadId === thread.id ? 'blue.50' : 'gray.100' }}
                                        onClick={() => setActiveThreadId(thread.id)}
                                        align="center"
                                    >
                                        <Avatar 
                                            size="md" 
                                            name={getThreadName(thread)} 
                                            src={getThreadAvatar(thread) || undefined} 
                                            icon={thread.type === 'group' ? <FiUsers /> : undefined}
                                            bg={thread.type === 'group' ? 'teal.500' : 'gray.400'}
                                            color="white"
                                        />
                                        <Box ml={3} flex="1" overflow="hidden">
                                            <Flex justify="space-between" align="center">
                                                <Text fontWeight="600" color="gray.800" isTruncated>{getThreadName(thread)}</Text>
                                                {thread.lastMessage && (
                                                    <Text fontSize="xs" color="gray.400">
                                                        {new Date(thread.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                )}
                                            </Flex>
                                            <Flex justify="space-between" align="center" mt={1}>
                                                <Text fontSize="sm" color="gray.500" isTruncated>
                                                    {thread.lastMessage ? (
                                                       thread.lastMessage.sender.id === user.id ? `You: ${thread.lastMessage.body}` : `${thread.lastMessage.sender.first_name}: ${thread.lastMessage.body}`
                                                    ) : 'New conversation'}
                                                </Text>
                                                {thread.unread_count > 0 && (
                                                    <Flex bg="blue.500" color="white" w={5} h={5} borderRadius="full" align="center" justify="center" fontSize="xs" fontWeight="bold">
                                                        {thread.unread_count}
                                                    </Flex>
                                                )}
                                            </Flex>
                                        </Box>
                                    </Flex>
                                ))}
                            </VStack>
                        )}
                    </Box>
                </Box>

                {/* Main Chat Area */}
                <Box flex="1" display={{ base: activeThreadId ? 'flex' : 'none', md: 'flex' }} flexDirection="column" bg="white">
                    {activeThreadId ? (
                        <>
                            {/* Chat Header */}
                            <Flex p={4} borderBottom="1px solid" borderColor="gray.200" bg="white" align="center" shadow="sm" zIndex={10}>
                                <Button display={{ md: 'none' }} mr={3} size="sm" onClick={() => setActiveThreadId(null)}>Back</Button>
                                {(() => {
                                    const t = threads.find(x => x.id === activeThreadId);
                                    if (!t) return <Text>Loading...</Text>;
                                    return (
                                        <>
                                            <Avatar size="sm" name={getThreadName(t)} src={getThreadAvatar(t)} bg={t.type === 'group' ? 'teal.500' : 'gray.400'} />
                                            <VStack ml={3} align="start" spacing={0}>
                                                <Text fontWeight="bold" color="gray.800">{getThreadName(t)}</Text>
                                                <Text fontSize="xs" color="gray.500">{t.type === 'group' ? `${t.members.length} members` : 'Direct Message'}</Text>
                                            </VStack>
                                        </>
                                    );
                                })()}
                            </Flex>

                            {/* Messages View */}
                            <Box flex="1" overflowY="auto" p={6} bg="gray.50">
                                {isLoadingMessages ? (
                                    <Flex justify="center" p={10}><Spinner color="blue.500" /></Flex>
                                ) : (
                                    <VStack spacing={4} align="stretch">
                                        {messages.map((msg) => {
                                            const isMe = msg.sender_id === user.id;
                                            return (
                                                <Flex key={msg.id} justify={isMe ? 'flex-end' : 'flex-start'}>
                                                    {!isMe && (
                                                        <Avatar size="sm" name={`${msg.sender.first_name}`} src={msg.sender.avatar_path} mr={2} mt={1} />
                                                    )}
                                                    <Box maxW="70%">
                                                        {!isMe && <Text fontSize="xs" color="gray.500" mb={1} ml={1}>{msg.sender.first_name}</Text>}
                                                        <Box 
                                                            bg={isMe ? 'blue.500' : 'white'} 
                                                            color={isMe ? 'white' : 'gray.800'} 
                                                            p={3} px={4} 
                                                            borderRadius="2xl" 
                                                            borderTopRightRadius={isMe ? 'sm' : '2xl'}
                                                            borderTopLeftRadius={!isMe ? 'sm' : '2xl'}
                                                            shadow="sm"
                                                            border="1px solid"
                                                            borderColor={isMe ? 'blue.500' : 'gray.200'}
                                                        >
                                                            <Text fontSize="sm">{msg.body}</Text>
                                                        </Box>
                                                        <Text fontSize="xs" color="gray.400" mt={1} textAlign={isMe ? 'right' : 'left'} ml={1}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                    </Box>
                                                </Flex>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </VStack>
                                )}
                            </Box>

                            {/* Input Area */}
                            <Box p={4} bg="white" borderTop="1px solid" borderColor="gray.200">
                                <form onSubmit={handleSendMessage}>
                                    <HStack>
                                        <Input 
                                            value={messageText} 
                                            onChange={(e) => setMessageText(e.target.value)} 
                                            placeholder="Type a message..." 
                                            size="lg" 
                                            borderRadius="full"
                                            bg="gray.100"
                                            border="none"
                                            _focus={{ shadow: 'sm', bg: 'white', border: '1px solid', borderColor: 'blue.300' }}
                                        />
                                        <IconButton 
                                            type="submit" 
                                            colorScheme="blue" 
                                            borderRadius="full" 
                                            size="lg" 
                                            icon={<FiSend />} 
                                            isLoading={isSending} 
                                            isDisabled={!messageText.trim()}
                                        />
                                    </HStack>
                                </form>
                            </Box>
                        </>
                    ) : (
                        <Flex flex="1" align="center" justify="center" bg="gray.50" direction="column">
                            <Box p={6} bg="white" borderRadius="full" mb={4} shadow="sm">
                                <FiMessageSquare size={48} color="#cbd5e1" />
                            </Box>
                            <Heading size="md" color="gray.600" mb={2}>Your Messages</Heading>
                            <Text color="gray.400" textAlign="center">Select a conversation from the left<br/>or start a new chat.</Text>
                            <Button mt={6} colorScheme="blue" leftIcon={<FiPlus />} onClick={onDirectOpen}>Start Chat</Button>
                        </Flex>
                    )}
                </Box>
            </Flex>

            {/* Direct Chat Modal */}
            <Modal isOpen={isDirectOpen} onClose={onDirectClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>New Direct Message</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel>Select Colleague</FormLabel>
                            <Select placeholder="Choose an employee" value={directUserId} onChange={(e) => setDirectUserId(e.target.value)}>
                                {staffList.filter(s => s.id !== user.id).map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onDirectClose}>Cancel</Button>
                        <Button colorScheme="blue" onClick={handleCreateDirect} isDisabled={!directUserId}>Start Chat</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Group Chat Modal */}
            <Modal isOpen={isGroupOpen} onClose={onGroupClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>New Group Chat</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Group Name</FormLabel>
                                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Marketing Team" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Select Members</FormLabel>
                                <Box maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p={3}>
                                    <CheckboxGroup colorScheme="teal" value={groupMembers} onChange={setGroupMembers}>
                                        <VStack align="start">
                                            {staffList.filter(s => s.id !== user.id).map(staff => (
                                                <Checkbox key={staff.id} value={staff.id.toString()}>{staff.firstName} {staff.lastName}</Checkbox>
                                            ))}
                                        </VStack>
                                    </CheckboxGroup>
                                </Box>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onGroupClose}>Cancel</Button>
                        <Button colorScheme="teal" onClick={handleCreateGroup} isDisabled={!groupName || groupMembers.length === 0}>Create Group</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </DashboardLayout>
    );
};

export default Chat;
