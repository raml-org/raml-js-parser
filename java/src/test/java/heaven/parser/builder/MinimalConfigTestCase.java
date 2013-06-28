package heaven.parser.builder;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import heaven.model.Action;
import heaven.model.ActionType;
import heaven.model.Heaven;
import heaven.model.ParamType;
import heaven.model.Resource;
import heaven.parser.visitor.BuilderNodeHandler;
import org.apache.commons.io.IOUtils;
import org.hamcrest.CoreMatchers;
import org.junit.Test;

public class MinimalConfigTestCase
{

    @Test
    public void basicConfig() throws Exception
    {
        String simpleTest = IOUtils.toString(getClass().getClassLoader().getResourceAsStream("heaven/root-elements.yaml"));
        BuilderNodeHandler<Heaven> havenSpecBuilder = new BuilderNodeHandler<Heaven>(Heaven.class);
        Heaven heaven = havenSpecBuilder.build(simpleTest);
        assertThat(heaven.getTitle(), is("Sample API"));
        assertThat(heaven.getVersion(), is("v1"));
        assertThat(heaven.getBaseUri(), is("https://{host}.sample.com/{path}"));

        assertThat(heaven.getUriParameters().size(), is(2));
        assertThat(heaven.getUriParameters().get("host").getName(), is("Host"));
        assertThat(heaven.getUriParameters().get("host").getType(), is(ParamType.STRING));
        assertThat(heaven.getUriParameters().get("path").getName(), is("Path"));
        assertThat(heaven.getUriParameters().get("path").getType(), is(ParamType.STRING));

        assertThat(heaven.getResources().size(), is(1));
        Resource mediaResource = heaven.getResources().get("/media");
        assertThat(mediaResource.getName(), is("Media"));
        Action action = mediaResource.getAction(ActionType.GET);
        assertThat(action.getName(), is("retrieve"));
        assertThat(action.getBody().size(), is(1));
        assertThat(action.getBody().get("application/json"), CoreMatchers.notNullValue());

    }
}
