import React, { useCallback, useState, useEffect } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassNode from "../components/tablas/ClassNode";
import { useParams } from "react-router-dom";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import Sidebar from "../components/control/Sidebar";
import CustomEdgeStartEnd from "../components/CustomEdgeStartEnd";
import { onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase-confing/Firebase";

const nodeTypes = { classNode: ClassNode };
const edgeTypes = { "start-end": CustomEdgeStartEnd };
const edgeOptions = { animated: true, style: { stroke: "black" } };
const connectionLineStyle = { stroke: "black" };
let nodeId = 0;

const BoardPage = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const { id: boardId } = useParams(); 

  const reactFlowInstance = useReactFlow();

  // Función genérica para actualizar Firebase (nodos o aristas)
  const updateBoardData = async (updatedData, key) => {
    try {
      const boardDocRef = doc(db, "board", boardId);
      await updateDoc(boardDocRef, { [key]: updatedData });
    } catch (error) {
      console.error(`Error al actualizar ${key} en Firebase:`, error);
    }
  };
  // Sincronización de nodos y Firebase
  const onNodesChange = useCallback(
    async (changes) => {
      const hasDeletedNodes = changes.some(
        (change) => change.type === "remove"
      );
      setNodes((nds) => applyNodeChanges(changes, nds));

      if (hasDeletedNodes) {
        const nodesToDelete = changes
          .filter((change) => change.type === "remove")
          .map((change) => change.id);
        try {
          const boardDocRef = doc(db, "board", boardId);
          const boardSnapshot = await getDoc(boardDocRef);
          if (boardSnapshot.exists()) {
            const currentNodes = boardSnapshot.data().nodes || [];
            const updatedNodes = currentNodes.filter(
              (node) => !nodesToDelete.includes(node.id)
            );
            await updateBoardData(updatedNodes, "nodes");
          }
        } catch (error) {
          console.error("Error al eliminar el nodo de Firebase:", error);
        }
      }
    },
    [boardId]
  );

  // Sincronización de aristas y Firebase
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      const updatedEdges = applyEdgeChanges(changes, edges);
      updateBoardData(updatedEdges, "edges");
    },
    [edges, boardId]
  );

  const onConnect = useCallback(
    (connection) => {
      console.log("Nueva conexión:", connection);

      // Verificar si los valores clave están presentes en `connection`
      if (!connection.source || !connection.target) {
        console.error("Conexión inválida:", connection);
        return;
      }

      const newEdge = {
        ...connection,
        data: {
          startLabel: connection.startLabel || "0..*", // Asegurarse de que las etiquetas existan
          endLabel: connection.endLabel || "1",
          type: connection.type || "association", // Tipo predeterminado
        },
        type: "start-end",
      };

      console.log("Nueva arista creada:", newEdge);

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      updateBoardData(updatedEdges, "edges");
    },
    [edges, boardId]
  );

  // Agregar nodos a Firebase
  const addNode = useCallback(async () => {
    nodeId++; // Incrementa el nodeId
    const newNode = {
      id: `${nodeId}`, // Usar el nodeId que se incrementó
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      type: "classNode",
      data: {
        className: `Clase ${nodeId}`,
        attributes: ["+ nuevoAtributo: string"],
        methods: ["+ nuevoMetodo(): void"],
      },
    };

    try {
      const boardDocRef = doc(db, "board", boardId);
      const boardSnapshot = await getDoc(boardDocRef);
      if (boardSnapshot.exists()) {
        const currentNodes = boardSnapshot.data().nodes || [];
        const updatedNodes = [...currentNodes, newNode];
        await updateBoardData(updatedNodes, "nodes");
        setNodes(updatedNodes);
      }
      reactFlowInstance.addNodes(newNode);
    } catch (error) {
      console.error("Error al agregar el nodo a Firebase:", error);
    }
  }, [reactFlowInstance, boardId]);

  // Actualiza la posición de un nodo en Firebase al soltar
  const onNodeDragStop = useCallback(
    async (_event, node) => {
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setNodes(updatedNodes);
      updateBoardData(updatedNodes, "nodes");
    },
    [nodes, boardId]
  );

  // Maneja la edición de nodos
  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setEditingData({ ...node.data });
  };
  // Maneja la edición de aristas
  const onEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setEditingEdge({ ...edge.data });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInputChangeEdge = (event) => {
    const { name, value } = event.target;

    setEditingEdge((prev) => ({
      ...prev,
      [name]: value, // Se actualiza el campo correcto en función del name del input
    }));
  };

  const handleArrayChange = (name, value) => {
    setEditingData((prev) => ({
      ...prev,
      [name]: value.split("\n"),
    }));
  };

  const updateNodeData = async () => {
    const updatedNodes = nodes.map((node) =>
      node.id === selectedNode.id ? { ...node, data: editingData } : node
    );
    setNodes(updatedNodes);
    await updateBoardData(updatedNodes, "nodes");
    setSelectedNode(null);
  };

  const updateEdgeData = async () => {
    const updatedEdges = edges.map((edge) =>
      edge.id === selectedEdge.id
        ? { ...edge, data: { ...editingEdge, type: editingEdge.type } }
        : edge
    );
    setEdges(updatedEdges);
    await updateBoardData(updatedEdges, "edges");
    setSelectedEdge(null);
  };

  // Escucha en tiempo real los cambios en Firebase
  useEffect(() => {
    const boardDocRef = doc(db, "board", boardId);
    const unsubscribe = onSnapshot(boardDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const boardData = docSnapshot.data();
        setNodes(boardData.nodes || []);
        setEdges(boardData.edges || []);
        nodeId = boardData.nodes.length;
      }
    });
    return () => unsubscribe();
  }, [boardId]);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <Sidebar
        addNode={addNode}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        editingData={editingData}
        editingEdge={editingEdge}
        handleInputChange={handleInputChange}
        handleArrayChange={handleArrayChange}
        handleInputChangeEdge={handleInputChangeEdge}
        updateNodeData={updateNodeData}
        updateEdgeData={updateEdgeData}
      />
      <div style={{ flex: 1, position: "relative" }}>
        <h2>Diagrama UML</h2>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          edgeOptions={edgeOptions}
          style={{ width: "100%", height: "100%" }}
          connectionLineStyle={connectionLineStyle}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default function () {
  return (
    <ReactFlowProvider>
      <BoardPage />
    </ReactFlowProvider>
  );
}
