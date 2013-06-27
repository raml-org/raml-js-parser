package heaven.parser.rule;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.yaml.snakeyaml.nodes.MappingNode;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;
import org.yaml.snakeyaml.nodes.ScalarNode;

/**
 * This Rule handles each parameter
 * <p/>
 * %TAG ! tag:heaven-lang.org,1.0: --- title: Salesforce Chatter Communities REST API version: v28.0 baseUri: https://{communityDomain}.force.com/{communityPath} uriParameters:
 * communityDomain: name: Community Domain type: string communityPath: name: Community Path type: string pattern: ^[a-zA-Z0-9][-a-zA-Z0-9]*$ minimumLength: 1
 * <p/>
 * A new ParamRule will be created for communityPath and communityDomain
 *
 * @author seba
 */
public class ParamRule extends DefaultTupleRule<ScalarNode, Node>
{

    private List<? extends ITupleRule<?, ?>> rules;

    public ParamRule()
    {
        super();
        EnumSimpleRule typeRule = new EnumSimpleRule("type", false, Arrays.asList("string", "number", "integer", "date"));
        rules = Arrays.asList(new SimpleRule("name", false), typeRule, new EnumModifierRule("minLength", Arrays.asList("string"), typeRule), new EnumModifierRule("maxLength", Arrays.asList("string"), typeRule), new EnumModifierRule("minimum", Arrays.asList("integer", "number"), typeRule), new EnumModifierRule("minimum", Arrays.asList("integer", "number"), typeRule));
    }

    @Override
    public boolean handles(NodeTuple touple)
    {
        return touple.getKeyNode() instanceof ScalarNode && touple.getValueNode() instanceof MappingNode;
    }

    @Override
    public List<ValidationResult> onRuleEnd()
    {
        return Collections.emptyList();
    }

    @Override
    public ITupleRule<?, ?> getRuleForTuple(NodeTuple nodeTuple)
    {
        Node keyNode = nodeTuple.getKeyNode();
        if (keyNode instanceof ScalarNode)
        {
            for (ITupleRule<?, ?> complexRule : rules)
            {
                if (complexRule.handles(nodeTuple))
                {
                    return complexRule;
                }
            }

        }
        return new DefaultTupleRule<Node, Node>();
    }
}
