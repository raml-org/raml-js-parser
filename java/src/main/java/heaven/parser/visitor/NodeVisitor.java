package heaven.parser.visitor;

import java.util.List;

import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeId;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;
import org.yaml.snakeyaml.nodes.SequenceNode;

public class NodeVisitor
{

    private NodeHandler nodeHandler;

    public NodeVisitor(NodeHandler nodeHandler)
    {
        super();
        this.nodeHandler = nodeHandler;
    }

    private void visitMappingNode(MappingNode mappingNode, TupleType tupleType)
    {
        nodeHandler.onMappingNodeStart(mappingNode);
        doVisitMappingNode(mappingNode);
        nodeHandler.onMappingNodeEnd(mappingNode);
    }

    private void doVisitMappingNode(MappingNode mappingNode)
    {
        List<NodeTuple> touples = mappingNode.getValue();
        for (NodeTuple nodeTuple : touples)
        {
            nodeHandler.onTupleStart(nodeTuple);
            Node keyNode = nodeTuple.getKeyNode();
            Node valueNode = nodeTuple.getValueNode();
            visit(keyNode, TupleType.KEY);
            visit(valueNode, TupleType.VALUE);
            nodeHandler.onTupleEnd(nodeTuple);
        }
    }

    public void visitDocument(MappingNode node)
    {
        nodeHandler.onDocumentStart(node);
        doVisitMappingNode(node);
        nodeHandler.onDocumentEnd(node);
    }

    private void visit(Node node, TupleType tupleType)
    {
        if (node.getNodeId() == NodeId.mapping)
        {
            visitMappingNode((MappingNode) node, tupleType);
        }
        else if (node.getNodeId() == NodeId.scalar)
        {
            visitScalar((ScalarNode) node, tupleType);
        }
        else if (node.getNodeId() == NodeId.sequence)
        {
            visitSequence((SequenceNode) node, tupleType);
        }
    }

    private void visitSequence(SequenceNode node, TupleType tupleType)
    {
        nodeHandler.onSequenceStart(node, tupleType);
        List<Node> value = node.getValue();
        for (Node node2 : value)
        {
            visit(node2, tupleType);
        }
        nodeHandler.onSequenceEnd(node, tupleType);
    }

    private void visitScalar(ScalarNode node, TupleType tupleType)
    {
        nodeHandler.onScalar(node, tupleType);
    }
}
