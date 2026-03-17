import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Avatar,
  Icon,
  Button,
  InputGroup,
  InputLeftElement,
  Input,
  Flex,
  Tooltip,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiSearch,
  FiMail,
  FiPhone,
  FiUsers,
  FiRefreshCw,
  FiClipboard,
  FiCheckCircle,
  FiEye,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

// ── Task-related modals ──────────────────────────────────────────────────
import AssignTaskModal from "../../components/tasks/AssignTaskModal";
import StaffTasksModal from "../../components/common/StaffTasksModal";
import ViewTasksDrawer from "../../components/common/ViewTasksDrawer";

import { useAuth } from "../../contexts/AuthContext";
import { useGetMyCreatedUsersQuery } from "../../store/apiSlice";

// ─────────────────────────────────────────────────────────────────────────
const ManagerStaffList = () => {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId || user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const {
    isOpen: isTaskOpen,
    onOpen: onTaskOpen,
    onClose: onTaskClose,
  } = useDisclosure();
  const {
    isOpen: isMyTaskOpen,
    onOpen: onMyTaskOpen,
    onClose: onMyTaskClose,
  } = useDisclosure();
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data, isLoading, error, refetch } = useGetMyCreatedUsersQuery(
    { company_id: companyId, created_by_user: managerId },
    { skip: !companyId || !managerId },
  );

  const raw = data?.data || data?.users || data || [];
  const staffList = Array.isArray(raw) ? raw : [];

  const filtered = staffList.filter((s) => {
    const name = `${s.first_name || s.firstName || ""} ${s.last_name || s.lastName || ""}`;
    return `${name} ${s.email || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const activeCount = filtered.filter(
    (s) => s.status === "active" || s.status === 1,
  ).length;

  const openAssignTask = (s) => {
    setSelectedStaff(s);
    onTaskOpen();
  };
  const openMyTasks = (s) => {
    setSelectedStaff(s);
    onMyTaskOpen();
  };

  if (isLoading)
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading staff…" />
      </DashboardLayout>
    );
  if (error)
    return (
      <DashboardLayout>
        <Card>
          <EmptyState title="Error" description={error?.data?.message} />
        </Card>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        {/* ── Hero Header ── */}
        <Box
          bgGradient="linear(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          position="relative"
          overflow="hidden"
          boxShadow="xl"
        >
          {/* Background abstract elements */}
          <Box position="absolute" top="-20%" right="-5%" w="300px" h="300px" bg="purple.500" opacity="0.1" filter="blur(60px)" borderRadius="full" />
          <Box position="absolute" bottom="-20%" left="10%" w="200px" h="200px" bg="blue.500" opacity="0.1" filter="blur(40px)" borderRadius="full" />
          <Box position="absolute" top="10%" right="15%" w="100px" h="100px" bg="cyan.500" opacity="0.15" filter="blur(30px)" borderRadius="full" />

          <Button
            variant="unstyled"
            display="flex"
            alignItems="center"
            gap={2}
            color="whiteAlpha.800"
            fontSize="sm"
            mb={5}
            h="auto"
            _hover={{ color: "white" }}
            onClick={() => navigate("/company/managers")}
            position="relative"
            zIndex={1}
          >
            <Icon as={FiArrowLeft} boxSize={4} /> Back to Managers
          </Button>

          <Flex
            justify="space-between"
            align="flex-end"
            flexWrap="wrap"
            gap={4}
            position="relative"
            zIndex={1}
          >
            <Box>
              <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" fontSize="xs" mb={3} backdropFilter="blur(10px)">
                Manager ID: {managerId}
              </Badge>
              <Heading size="xl" color="white" letterSpacing="-0.02em" mb={1}>
                Staff Members
              </Heading>
              <Text color="whiteAlpha.800">
                {filtered.length} staff · {activeCount} active
              </Text>
            </Box>
            <HStack spacing={3} flexWrap="wrap">
              <Badge
                bg="whiteAlpha.200"
                color="white"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="xs"
                backdropFilter="blur(10px)"
              >
                <HStack spacing={1.5}>
                  <Icon as={FiUsers} boxSize={3.5} />
                  <Text>{staffList.length} Total</Text>
                </HStack>
              </Badge>
              <Badge
                bg="green.500"
                color="white"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="xs"
                border="1px solid"
                borderColor="green.400"
              >
                <HStack spacing={1.5}>
                  <Icon as={FiCheckCircle} boxSize={3.5} />
                  <Text>{activeCount} Active</Text>
                </HStack>
              </Badge>
            </HStack>
          </Flex>
        </Box>

        {/* ── Toolbar ── */}
        <HStack spacing={3} flexWrap="wrap">
          <Card flex={1} minW="200px" py={0} px={0}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" pl={1}>
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search staff…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
                border="none"
                focusBorderColor="purple.400"
                _focus={{ boxShadow: "none" }}
              />
            </InputGroup>
          </Card>
          <Tooltip label="View all company tasks">
            <Button
              leftIcon={<FiEye />}
              variant="outline"
              colorScheme="purple"
              borderRadius="xl"
              onClick={onDrawerOpen}
            >
              View All Tasks
            </Button>
          </Tooltip>
          <Tooltip label="Refresh">
            <IconButton
              icon={<FiRefreshCw />}
              variant="outline"
              borderRadius="xl"
              onClick={refetch}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>

        {/* ── Staff Table ── */}
        {filtered.length === 0 ? (
          <Card border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
            <EmptyState
              title={
                searchTerm
                  ? "No staff found"
                  : "No staff assigned to this manager"
              }
              description={
                searchTerm
                  ? "Try a different search"
                  : "Assign staff from Staff Management"
              }
              icon={FiUsers}
            />
          </Card>
        ) : (
          <Card p={0} overflow="hidden" border="1px solid" borderColor="gray.100" shadow="sm" borderRadius="2xl">
            <Box overflowX="auto">
              <Table variant="simple" size="sm" w="100%" style={{ minWidth: '800px' }}>
                <Thead>
                  <Tr>
                    {[
                      "Staff Member",
                      "Email",
                      "Phone",
                      "Role",
                      "Status",
                      "Task Actions",
                      "Action",
                    ].map((h, i, arr) => (
                      <Th
                        key={h}
                        bg="gray.800"
                        color="white"
                        fontSize="xs"
                        py={4}
                        borderBottom="none"
                        textAlign={i >= arr.length - 2 ? "center" : "left"}
                        whiteSpace="nowrap"
                      >
                        {h}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.map((s, i) => {
                    const name =
                      `${s.first_name || s.firstName || ""} ${s.last_name || s.lastName || ""}`.trim();
                    const role =
                      typeof s.role === "object"
                        ? s.role?.name
                        : s.role || "Staff";
                    const isActive = s.status === "active" || s.status === 1;
                    return (
                      <Tr
                        key={s.id}
                        bg={i % 2 === 0 ? "white" : "gray.50"}
                        _hover={{ bg: "purple.50" }}
                        transition="all 0.15s"
                      >
                        <Td py={4}>
                          <HStack spacing={3}>
                            <Box position="relative">
                              <Avatar
                                size="md"
                                src={s.p_image_url}
                                name={name}
                                bg="purple.100"
                                color="purple.600"
                              />
                              <Box
                                position="absolute"
                                bottom={0}
                                right={0}
                                w="10px"
                                h="10px"
                                borderRadius="full"
                                bg={isActive ? "green.400" : "gray.300"}
                                border="2px solid white"
                              />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="700" fontSize="sm">
                                {name || "—"}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                ID #{s.id}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={1.5}>
                            <Icon as={FiMail} boxSize={3.5} color="gray.400" />
                            <Text fontSize="sm" color="gray.600">
                              {s.email || "—"}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={1.5}>
                            <Icon as={FiPhone} boxSize={3.5} color="gray.400" />
                            <Text fontSize="sm" color="gray.600">
                              {s.phone || "—"}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme="purple"
                            borderRadius="full"
                            px={2.5}
                            fontSize="xs"
                          >
                            {role}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1.5}>
                            <Box
                              w="7px"
                              h="7px"
                              borderRadius="full"
                              bg={isActive ? "green.400" : "gray.300"}
                            />
                            <Badge
                              colorScheme={isActive ? "green" : "gray"}
                              borderRadius="full"
                              px={2}
                              fontSize="xs"
                            >
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack justify="center" spacing={2}>
                            <Tooltip label="Create & Assign Task">
                              <Button
                                size="sm"
                                leftIcon={<FiClipboard />}
                                bgGradient="linear(to-r, purple.500, blue.500)"
                                color="white"
                                borderRadius="lg"
                                fontSize="xs"
                                onClick={() => openAssignTask(s)}
                                _hover={{
                                  bgGradient:
                                    "linear(to-r, purple.600, blue.600)",
                                  transform: "translateY(-1px)",
                                  shadow: "md",
                                }}
                                transition="all 0.2s"
                              >
                                Assign Task
                              </Button>
                            </Tooltip>
                            <Tooltip label="View staff tasks">
                              <Button
                                size="sm"
                                leftIcon={<FiEye />}
                                variant="outline"
                                colorScheme="blue"
                                borderRadius="lg"
                                fontSize="xs"
                                onClick={() => openMyTasks(s)}
                                _hover={{
                                  transform: "translateY(-1px)",
                                  shadow: "md",
                                }}
                                transition="all 0.2s"
                              >
                                View Tasks
                              </Button>
                            </Tooltip>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack justify="center">
                            <Tooltip label="View Details (Leave / Check-in)">
                              <IconButton
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                colorScheme="purple"
                                aria-label="View staff details"
                                onClick={() =>
                                  navigate(`/company/staff/${s.id}`)
                                }
                                _hover={{ transform: "scale(1.15)" }}
                                transition="all 0.15s"
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </Card>
        )}

        {/* ── Info hint ── */}
        <Card
          bgGradient="linear(135deg, purple.50, blue.50)"
          border="1px solid"
          borderColor="purple.100"
        >
          <HStack spacing={4}>
            <Box p={3} bg="purple.100" borderRadius="xl" flexShrink={0}>
              <Icon as={FiClipboard} boxSize={5} color="purple.600" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="800" color="purple.800">
                Task Flow
              </Text>
              <Text fontSize="xs" color="purple.700">
                <strong>Assign Task</strong> — create & assign in 2 steps.
                &nbsp;
                <strong>View Tasks</strong> — see this staff's tasks; click any
                to add Action or Feedback. &nbsp;
                <strong>View All Tasks</strong> — company-wide task list.
              </Text>
            </VStack>
          </HStack>
        </Card>
      </VStack>

      {/* ── Modals ── */}
      {selectedStaff && (
        <>
          <AssignTaskModal
            isOpen={isTaskOpen}
            onClose={onTaskClose}
            staffMember={selectedStaff}
            companyStaff={staffList}
            companyId={companyId}
          />
          <StaffTasksModal
            isOpen={isMyTaskOpen}
            onClose={onMyTaskClose}
            staffMember={selectedStaff}
            companyId={companyId}
          />
        </>
      )}
      <ViewTasksDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        companyId={companyId}
      />
    </DashboardLayout>
  );
};

export default ManagerStaffList;
