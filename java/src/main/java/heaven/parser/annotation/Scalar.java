package heaven.parser.annotation;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

import heaven.parser.resolver.TupleHandler;
import heaven.parser.rule.ITupleRule;

@Retention(value = RetentionPolicy.RUNTIME)
public @interface Scalar
{

    boolean required() default false;

    Class<? extends  ITupleRule> rule() default ITupleRule.class;

    Class<? extends TupleHandler> handler() default TupleHandler.class;
}
