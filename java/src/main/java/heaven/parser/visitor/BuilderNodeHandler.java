package heaven.parser.visitor;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

import heaven.parser.builder.TupleBuilder;
import heaven.parser.rule.ValidationResult;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.error.YAMLException;
import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;
import org.yaml.snakeyaml.nodes.SequenceNode;

public class BuilderNodeHandler implements NodeHandler
{


    private Class documentClass;

    private Stack<TupleBuilder<?, ?>> builderContext = new Stack<TupleBuilder<?, ?>>();
    private Stack<Object> objectContext = new Stack<Object>();


    private List<ValidationResult> errorMessage = new ArrayList<ValidationResult>();

    public BuilderNodeHandler(Class documentClass)
    {
        this.documentClass = documentClass;

    }

    public List<ValidationResult> validate(String content)
    {
        Yaml yamlParser = new Yaml();

        try
        {
            NodeVisitor nodeVisitor = new NodeVisitor(this);
            for (Node data : yamlParser.composeAll(new StringReader(content)))
            {
                if (data instanceof MappingNode)
                {
                    nodeVisitor.visitDocument((MappingNode) data);
                }
                else
                {
                    //   errorMessage.add(ValidationResult.createErrorResult(EMPTY_DOCUMENT_MESSAGE));
                }
            }

        }
        catch (YAMLException ex)
        {
            // errorMessage.add(ValidationResult.createErrorResult(ex.getMessage()));
        }
        return errorMessage;
    }


    @Override
    public void onMappingNodeStart(MappingNode mappingNode)
    {
        TupleBuilder<?, ?> peek = builderContext.peek();
        Object parentObject = objectContext.peek();
        Object object = ((TupleBuilder<?, MappingNode>) peek).buildValue(parentObject, mappingNode);
        objectContext.push(object);

    }

    @Override
    public void onMappingNodeEnd(MappingNode mappingNode)
    {
        objectContext.pop();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void onSequenceStart(SequenceNode node, TupleType tupleType)
    {
        //List<ValidationResult> result;
        //TupleBuilder<?, ?> peek = builderContext.peek();
        //
        //switch (toupleType)
        //{
        //    case VALUE:
        //        result = ((TupleBuilder<?, SequenceNode>) peek).buildValue(node);
        //        break;
        //    default:
        //        result = ((TupleBuilder<SequenceNode, ?>) peek).buildKey(node);
        //        break;
        //}
        //addErrorMessageIfRequired(node, result);
    }

    @Override
    public void onSequenceEnd(SequenceNode node, TupleType tupleType)
    {

    }

    @Override
    @SuppressWarnings("unchecked")
    public void onScalar(ScalarNode node, TupleType tupleType)
    {

        TupleBuilder<?, ?> peek = builderContext.peek();
        Object parentObject = objectContext.peek();

        switch (tupleType)
        {
            case VALUE:
                ((TupleBuilder<?, ScalarNode>) peek).buildValue(parentObject, node);
                break;

            default:
                ((TupleBuilder<ScalarNode, ?>) peek).buildKey(parentObject, node);

                break;
        }

    }


    @Override
    public void onDocumentStart(MappingNode node)
    {
        try
        {
            objectContext.push(documentClass.newInstance());
            builderContext.push(buildDocumentBuilder());
        }
        catch (InstantiationException e)
        {

        }
        catch (IllegalAccessException e)
        {

        }
    }

    private TupleBuilder<?, ?> buildDocumentBuilder()
    {
        return null;
    }

    @Override
    public void onDocumentEnd(MappingNode node)
    {
        objectContext.pop();


    }

    @Override
    public void onTupleEnd(NodeTuple nodeTuple)
    {
        TupleBuilder<?, ?> rule = builderContext.pop();

    }

    @Override
    public void onTupleStart(NodeTuple nodeTuple)
    {

        TupleBuilder<?, ?> tupleBuilder = builderContext.peek();
        if (tupleBuilder != null)
        {
            TupleBuilder<?, ?> builder = tupleBuilder.getBuiderForTuple(nodeTuple);
            builderContext.push(builder);
        }
        else
        {
            throw new IllegalStateException("Unexpected builderContext state");
        }

    }


}
