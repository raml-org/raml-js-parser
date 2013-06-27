package heaven;

import java.io.IOException;
import java.util.List;

import heaven.model.Heaven;
import heaven.parser.rule.SimpleRule;
import heaven.parser.rule.ValidationResult;
import heaven.parser.visitor.RuleNodeHandler;
import org.apache.commons.io.IOUtils;
import org.hamcrest.CoreMatchers;
import org.junit.Assert;
import org.junit.Test;


public class TitleTestCase
{

    @Test
    public void whenTitleIsNotDefinedErrorShouldBeShown() throws IOException
    {
        String simpleTest = IOUtils.toString(this.getClass().getClassLoader().getResourceAsStream("heaven/title-not-defined.yaml"), "UTF-8");
        RuleNodeHandler havenSpecValidator = new RuleNodeHandler(Heaven.class);
        List<ValidationResult> errors = havenSpecValidator.validate(simpleTest);
        Assert.assertFalse("Errors must not be empty", errors.isEmpty());
        Assert.assertThat(errors.get(0).getMessage(), CoreMatchers.is(SimpleRule.getMissingRuleMessage("title")));
    }

}
