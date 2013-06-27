package heaven;

import java.util.List;

import heaven.model.Heaven;
import heaven.parser.rule.BaseUriRule;
import heaven.parser.rule.ValidationResult;
import heaven.parser.visitor.RuleNodeHandler;
import org.hamcrest.CoreMatchers;
import org.junit.Assert;
import org.junit.Test;

/**
 * Created with IntelliJ IDEA.
 * User: santiagovacas
 * Date: 6/26/13
 * Time: 7:18 PM
 * To change this template use File | Settings | File Templates.
 */
public class BaseUriTestCase
{

    @Test
    public void testBaseURINotEmpty()
    {
        String simpleTest = "%TAG ! tag:heaven-lang.org,1.0:\n" + "---\n" + "version: v28.0\n" + "title: apiTitle\n" + "baseUri:";
        RuleNodeHandler havenSpecValidator = new RuleNodeHandler(Heaven.class);
        List<ValidationResult> errors = havenSpecValidator.validate(simpleTest);
        Assert.assertFalse("Errors must not be empty", errors.isEmpty());
        Assert.assertThat(errors.get(0).getMessage(), CoreMatchers.is("The baseUri element is not a valid URI"));
        Assert.assertThat(errors.get(1).getMessage(), CoreMatchers.is(BaseUriRule.getRuleEmptyMessage("baseUri")));
    }

    @Test
    public void testBaseURIPresent()
    {
        String simpleTest = "%TAG ! tag:heaven-lang.org,1.0:\n" + "---\n" + "version: v28.0\n" + "title: apiTitle";
        RuleNodeHandler havenSpecValidator = new RuleNodeHandler(Heaven.class);
        List<ValidationResult> errors = havenSpecValidator.validate(simpleTest);
        Assert.assertFalse("Errors must not be empty", errors.isEmpty());
        Assert.assertThat(errors.get(0).getMessage(), CoreMatchers.is(BaseUriRule.getMissingRuleMessage("baseUri")));
    }

    @Test
    public void testBaseURIisNotValid()
    {
        String simpleTest = "%TAG ! tag:heaven-lang.org,1.0:\n" + "---\n" + "version: v28.0\n" + "title: apiTitle\n" + "baseUri: notavaliduri.com";
        RuleNodeHandler havenSpecValidator = new RuleNodeHandler(Heaven.class);
        List<ValidationResult> errors = havenSpecValidator.validate(simpleTest);
        Assert.assertFalse("Errors must not be empty", errors.isEmpty());
        Assert.assertThat(errors.get(0).getMessage(), CoreMatchers.is(BaseUriRule.URI_NOT_VALID_MESSAGE));
    }

}
