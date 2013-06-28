package heaven.parser.builder;

import static org.hamcrest.CoreMatchers.is;

import heaven.model.Heaven;
import heaven.model.ParamType;
import heaven.parser.visitor.BuilderNodeHandler;
import org.apache.commons.io.IOUtils;
import org.junit.Assert;
import org.junit.Test;

public class MinimalConfigTestCase
{

    @Test
    public void basicConfig() throws Exception
    {
        String simpleTest = IOUtils.toString(getClass().getClassLoader().getResourceAsStream("heaven/root-elements.yaml"));
        BuilderNodeHandler<Heaven> havenSpecBuilder = new BuilderNodeHandler<Heaven>(Heaven.class);
        Heaven heaven = havenSpecBuilder.build(simpleTest);
        Assert.assertThat(heaven.getTitle(), is("Sample API"));
        Assert.assertThat(heaven.getVersion(), is("v1"));
        Assert.assertThat(heaven.getBaseUri(), is("https://{host}.sample.com/{path}"));
        Assert.assertThat(heaven.getUriParameters().size(), is(2));
        Assert.assertThat(heaven.getUriParameters().get("host").getName(), is("Host"));
        Assert.assertThat(heaven.getUriParameters().get("host").getType(), is(ParamType.STRING));

        Assert.assertThat(heaven.getUriParameters().get("path").getName(), is("Path"));
        Assert.assertThat(heaven.getUriParameters().get("path").getType(), is(ParamType.STRING));

    }
}
