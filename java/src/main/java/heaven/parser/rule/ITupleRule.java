package heaven.parser.rule;

import java.util.List;

import heaven.parser.resolver.TupleHandler;
import org.yaml.snakeyaml.nodes.Node;
import org.yaml.snakeyaml.nodes.NodeTuple;

public interface ITupleRule<K extends Node, V extends Node> extends TupleHandler
{


    /**
     * Validates the rule of the touple
     *
     * @param key
     * @return
     */
    List<ValidationResult> validateKey(K key);

    /**
     * Validates the rule of the touple
     *
     * @param key
     * @return
     */
    List<ValidationResult> validateValue(V key);

    List<ValidationResult> onRuleEnd();

    ITupleRule<?, ?> getRuleForTuple(NodeTuple nodeTuple);

    void setParentTupleRule(ITupleRule<?, ?> parent);

    ITupleRule<?, ?> getRuleByFieldName(String fieldName);

}
