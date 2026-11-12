library verilog;
use verilog.vl_types.all;
entity tb_counter_param is
    generic(
        W               : integer := 4
    );
    attribute mti_svvh_generic_type : integer;
    attribute mti_svvh_generic_type of W : constant is 1;
end tb_counter_param;
