package heaven.parser.visitor;

import org.yaml.snakeyaml.nodes.Node;

public class ErrorMessage
{

    private String errorMessage;
    private Node node;

    public ErrorMessage(String errorMessage, Node node)
    {
        super();
        this.errorMessage = errorMessage;
        this.node = node;
    }

    public String getErrorMessage()
    {
        return errorMessage;
    }

    public Node getNode()
    {
        return node;
    }

}
